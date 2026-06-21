import pool from '../config/database.js';

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fcm_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT NOT NULL UNIQUE,
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id)
  `);
  console.log('fcm_tokens table ready');
  await pool.end();
}

migrate().catch((e) => { console.error(e); process.exit(1); });
