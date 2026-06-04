import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runMigrations } from './migrations.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://agentic:agentic@localhost:5432/agentic_inbox',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
});

export async function initDb() {
  if (process.env.RUN_MIGRATIONS !== 'true') {
    console.log('Skipping startup migrations; set RUN_MIGRATIONS=true for local bootstrap');
    return;
  }

  try {
    await runMigrations(pool, join(__dirname, '../migrations'));
    console.log('Database migrations complete');
  } catch (e) {
    console.error('Migration error:', e.message);
    throw e;
  }
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
}
