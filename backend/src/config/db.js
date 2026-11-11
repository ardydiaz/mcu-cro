import mysql from 'mysql2/promise'

const { DB_HOST = 'localhost', DB_PORT = '3306', DB_NAME, DB_USER, DB_PASSWORD = '' } = process.env

if (!DB_NAME || !DB_USER) {
  throw new Error('Database is not configured: set DB_NAME and DB_USER (and DB_PASSWORD) in backend/.env')
}

export const dbConfig = {
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
}

// Shared connection pool. Timestamps are stored and read as UTC; DATE columns
// (birth dates) come back as 'YYYY-MM-DD' strings so no time zone can shift them.
export const db = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: ['DATE'],
  charset: 'utf8mb4',
})

// Make CURRENT_TIMESTAMP (column defaults, ON UPDATE) UTC as well; otherwise
// MySQL uses the server's local time and those values read back 8 hours off.
db.pool.on('connection', (connection) => connection.query("SET time_zone = '+00:00'"))
