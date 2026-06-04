import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runMigrations } from './migrations.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://agentic:agentic@localhost:5432/agentic_inbox',
  max: 1,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
});

try {
  await runMigrations(pool, join(__dirname, '../migrations'));
  console.log('Database migrations complete');
} finally {
  await pool.end();
}
