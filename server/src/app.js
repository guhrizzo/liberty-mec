import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { requireAuth } from './auth.js'
import { errorHandler, HttpError } from './http.js'
import authRoutes from './routes/auth.js'
import clientes from './routes/clientes.js'
import veiculos from './routes/veiculos.js'
import ordens from './routes/ordens.js'
import orcamentos from './routes/orcamentos.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1) // atrás do proxy da Render: IP real do cliente no rate limit
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({
    origin(origin, cb) {
      // Sem Origin (curl, health check) passa; com Origin só as permitidas.
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
      cb(null, false)
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/saude', (_req, res) => res.json({ ok: true }))

  app.use('/auth', authRoutes)
  app.use('/clientes', requireAuth, clientes)
  app.use('/veiculos', requireAuth, veiculos)
  app.use('/ordens', requireAuth, ordens)
  app.use('/orcamentos', requireAuth, orcamentos)

  app.use((_req, _res, next) => next(new HttpError(404, 'Rota não encontrada.')))
  app.use(errorHandler)
  return app
}
