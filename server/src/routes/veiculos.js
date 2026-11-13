import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { HttpError, notFound } from '../http.js'

const router = Router()

const COLS = `id, cliente_id as "clienteId", placa, modelo, ano, km, cor`
const id = z.uuid()

const base = z.object({
  clienteId: z.uuid(),
  placa: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{7,8}$/, 'Placa inválida.'),
  modelo: z.string().trim().min(2).max(120),
  ano: z.coerce.number().int().min(1950).max(2100).nullish(),
  km: z.coerce.number().int().min(0).max(5_000_000).nullish(),
  cor: z.string().trim().max(40).default(''),
})

async function clienteDaOficina(clienteId, oficinaId) {
  const r = await db.query('select 1 from clientes where id = $1 and oficina_id = $2', [clienteId, oficinaId])
  if (!r.rows[0]) throw new HttpError(400, 'Cliente inválido.')
}

router.get('/', async (req, res) => {
  const r = await db.query(`select ${COLS} from veiculos where oficina_id = $1 order by placa`, [req.user.oficinaId])
  res.json(r.rows)
})

router.post('/', async (req, res) => {
  const d = base.parse(req.body)
  await clienteDaOficina(d.clienteId, req.user.oficinaId)
  const r = await db.query(
    `insert into veiculos (oficina_id, cliente_id, placa, modelo, ano, km, cor) values ($1,$2,$3,$4,$5,$6,$7) returning ${COLS}`,
    [req.user.oficinaId, d.clienteId, d.placa, d.modelo, d.ano ?? null, d.km ?? null, d.cor])
  res.status(201).json(r.rows[0])
})

router.get('/:id', async (req, res) => {
  const r = await db.query(`select ${COLS} from veiculos where id = $1 and oficina_id = $2`, [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw notFound('Veículo')
  res.json(r.rows[0])
})

router.patch('/:id', async (req, res) => {
  const d = base.partial().parse(req.body)
  if (d.clienteId) await clienteDaOficina(d.clienteId, req.user.oficinaId)
  const r = await db.query(
    `update veiculos set cliente_id = coalesce($3, cliente_id), placa = coalesce($4, placa), modelo = coalesce($5, modelo),
            ano = coalesce($6, ano), km = coalesce($7, km), cor = coalesce($8, cor)
      where id = $1 and oficina_id = $2 returning ${COLS}`,
    [id.parse(req.params.id), req.user.oficinaId, d.clienteId ?? null, d.placa ?? null, d.modelo ?? null, d.ano ?? null, d.km ?? null, d.cor ?? null])
  if (!r.rows[0]) throw notFound('Veículo')
  res.json(r.rows[0])
})

router.delete('/:id', async (req, res) => {
  const r = await db.query('delete from veiculos where id = $1 and oficina_id = $2 returning id', [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw notFound('Veículo')
  res.status(204).end()
})

export default router
