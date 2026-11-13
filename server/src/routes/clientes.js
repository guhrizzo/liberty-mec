import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { notFound } from '../http.js'

const router = Router()

const COLS = `id, nome, telefone, email, cidade, criado_em::date::text as desde`

const base = z.object({
  nome: z.string().trim().min(2).max(160),
  telefone: z.string().trim().max(30).default(''),
  email: z.union([z.email().max(160), z.literal('')]).default(''),
  cidade: z.string().trim().max(80).default(''),
})
const id = z.uuid()

router.get('/', async (req, res) => {
  const r = await db.query(`select ${COLS} from clientes where oficina_id = $1 order by nome`, [req.user.oficinaId])
  res.json(r.rows)
})

router.post('/', async (req, res) => {
  const d = base.parse(req.body)
  const r = await db.query(
    `insert into clientes (oficina_id, nome, telefone, email, cidade) values ($1,$2,$3,$4,$5) returning ${COLS}`,
    [req.user.oficinaId, d.nome, d.telefone, d.email, d.cidade])
  res.status(201).json(r.rows[0])
})

router.get('/:id', async (req, res) => {
  const r = await db.query(`select ${COLS} from clientes where id = $1 and oficina_id = $2`, [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw notFound('Cliente')
  res.json(r.rows[0])
})

router.patch('/:id', async (req, res) => {
  const d = base.partial().parse(req.body)
  const r = await db.query(
    `update clientes set nome = coalesce($3, nome), telefone = coalesce($4, telefone),
            email = coalesce($5, email), cidade = coalesce($6, cidade)
      where id = $1 and oficina_id = $2 returning ${COLS}`,
    [id.parse(req.params.id), req.user.oficinaId, d.nome ?? null, d.telefone ?? null, d.email ?? null, d.cidade ?? null])
  if (!r.rows[0]) throw notFound('Cliente')
  res.json(r.rows[0])
})

router.delete('/:id', async (req, res) => {
  const r = await db.query('delete from clientes where id = $1 and oficina_id = $2 returning id', [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw notFound('Cliente')
  res.status(204).end()
})

export default router
