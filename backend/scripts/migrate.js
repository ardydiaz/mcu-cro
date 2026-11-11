// Applies database/migrations/*.sql in filename order, once each.
// Creates the database if it doesn't exist. Usage: npm run db:migrate
import { readdir, readFile } from 'node:fs/promises'
import mysql from 'mysql2/promise'
import { dbConfig } from '../src/config/db.js'

const dir = new URL('../database/migrations/', import.meta.url)
const { database, ...server } = dbConfig

const conn = await mysql.createConnection({ ...server, multipleStatements: true })
try {
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  )
  await conn.changeUser({ database })
  // Same as the app (src/config/db.js): timestamps are UTC.
  await conn.query("SET time_zone = '+00:00'")
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name       VARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  )`)

  const [rows] = await conn.query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.name))
  const pending = (await readdir(dir)).filter((f) => f.endsWith('.sql') && !applied.has(f)).sort()

  for (const file of pending) {
    process.stdout.write(`Applying ${file} … `)
    await conn.query(await readFile(new URL(file, dir), 'utf8'))
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file])
    console.log('done')
  }
  console.log(pending.length ? `Database "${database}" is up to date.` : `Nothing to apply; "${database}" is up to date.`)
} finally {
  await conn.end()
}
