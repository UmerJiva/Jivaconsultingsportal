// lib/db.js
import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:            process.env.DB_HOST     || 'localhost',
      port:            parseInt(process.env.DB_PORT || '3306'),
      user:            process.env.DB_USER     || 'root',
      password:        process.env.DB_PASSWORD || '',
      database:        process.env.DB_NAME     || 'eduportal',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           '+00:00',
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
