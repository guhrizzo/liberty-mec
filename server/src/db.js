import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'

// Mesma interface para dois motores: Postgres real (pg) em produção e PGlite (Postgres em processo) no dev/teste.
let engine

export async function initDb({ memory = false } = {}) {
  if (engine) return engine

  if (config.databaseUrl) {
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      // A Render exige TLS nas conexões externas; internas aceitam sem.
      ssl: /render\.com|sslmode=require/.test(config.databaseUrl) ? { rejectUnauthorized: false } : undefined,
      max: 10,
    })
    engine = {
      kind: 'pg',
      query: (text, params) => pool.query(text, params),
      async tx(fn) {
        const client = await pool.connect()
        try {
          await client.query('begin')
          const out = await fn({ query: (t, p) => client.query(t, p), exec: (t) => client.query(t) })
          await client.query('commit')
          return out
        } catch (e) {
          await client.query('rollback').catch(() => {})
          throw e
        } finally {
          client.release()
        }
      },
      close: () => pool.end(),
    }
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    let db
    if (memory) {
      db = new PGlite()
    } else {
      fs.mkdirSync(path.dirname(config.pgliteDir), { recursive: true })
      db = new PGlite(config.pgliteDir)
    }
    await db.waitReady
    engine = {
      kind: 'pglite',
      query: (text, params) => db.query(text, params),
      tx: (fn) => db.transaction((t) => fn({ query: (text, params) => t.query(text, params), exec: (text) => t.exec(text) })),
      close: () => db.close(),
    }
  }

  await migrate(engine)
  return engine
}

export const db = {
  query: (...a) => engine.query(...a),
  tx: (...a) => engine.tx(...a),
}

export const closeDb = async () => { if (engine) { await engine.close(); engine = undefined } }

// Migrações simples: arquivos NNN_nome.sql aplicados uma única vez, em ordem.
async function migrate(e) {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
  await e.query('create table if not exists _migrations (nome text primary key, aplicada_em timestamptz not null default now())')
  const done = new Set((await e.query('select nome from _migrations')).rows.map((r) => r.nome))
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    if (done.has(f)) continue
    const sql = fs.readFileSync(path.join(dir, f), 'utf8')
    await e.tx(async (t) => {
      await t.exec(sql) // script com vários comandos
      await t.query('insert into _migrations (nome) values ($1)', [f])
    })
  }
}
