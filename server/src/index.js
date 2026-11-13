import { config } from './config.js'
import { initDb, closeDb } from './db.js'
import { createApp } from './app.js'

const engine = await initDb()
const server = createApp().listen(config.port, () => {
  console.log(`Liberty Mec API em http://localhost:${config.port} (banco: ${engine.kind})`)
})

const stop = async () => { server.close(); await closeDb(); process.exit(0) }
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
