import app from './app.js'
import { env } from './config/env.js'

const server = app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`)
})

// Drop slow or stalled requests instead of holding connections open.
server.requestTimeout = 30_000
server.headersTimeout = 20_000
