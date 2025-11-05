import pool from './db';

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to Postgres at:', res.rows[0].now);
  } catch (err) {
    console.error('❌ DB connection error:', err);
  } finally {
    await pool.end();
  }
})();
