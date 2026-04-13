import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};

// Health check - verify DB connection
(async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    process.exit(1);
  }
})();

export default db;
