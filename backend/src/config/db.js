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

// Shared connection pool. Dates are stored and read as UTC.
export const db = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  timezone: 'Z',
  charset: 'utf8mb4',
})
