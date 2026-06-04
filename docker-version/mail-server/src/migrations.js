import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const MIGRATION_TABLE = 'schema_migrations';

function checksum(sql) {
  return createHash('sha256').update(sql).digest('hex');
}

function isAlreadyAppliedError(err) {
  return err?.code === '42P07' || String(err?.message || '').includes('already exists');
}

export async function runMigrations(pool, migrationsDir) {
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    const hash = checksum(sql);
    const existing = await pool.query(`SELECT checksum FROM ${MIGRATION_TABLE} WHERE filename = $1`, [file]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== hash) {
        throw new Error(`Migration checksum changed after apply: ${file}`);
      }
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATION_TABLE} (filename, checksum) VALUES ($1, $2)`,
        [file, hash],
      );
      await client.query('COMMIT');
      console.log(`Applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      if (file.startsWith('001_') && isAlreadyAppliedError(err)) {
        await pool.query(
          `INSERT INTO ${MIGRATION_TABLE} (filename, checksum) VALUES ($1, $2)
           ON CONFLICT (filename) DO NOTHING`,
          [file, hash],
        );
        console.warn(`Baselined existing schema migration ${file}: ${err.message}`);
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }
}
