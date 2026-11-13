import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { HttpError, notFound } from '../http.js'
import { itensSchema, itensJson, gravarItens } from '../lib/itens.js'

const router = Router()
const id = z.uuid()
const STATUS = ['avaliacao', 'aprovacao', 'execucao', 'pronto', 'entregue']

const SELECT = `select o.id, o.numero, o.veiculo_id as "veiculoId", o.relato, o.status,
  o.entrada::text as entrada, o.previsao::text as previsao, o.mecanico,
  ${itensJson('os_itens', 'ordem_id', 'o')} as itens
  from ordens o`

const base = z.object({
  veiculoId: z.uuid(),
  relato: z.string().trim().max(2000).default(''),
  mecanico: z.string().trim().max(80).default(''),
  previsao: z.iso.date().nullish(),
  status: z.enum(STATUS).optional(),
  itens: itensSchema.default([]),
})

async function veiculoDaOficina(veiculoId, oficinaId) {
  const r = await db.query('select 1 from veiculos where id = $1 and oficina_id = $2', [veiculoId, oficinaId])
  if (!r.rows[0]) throw new HttpError(400, 'Veículo inválido.')
}

const buscar = async (t, oid, ordemId) =>
  (await t.query(`${SELECT} where o.id = $1 and o.oficina_id = $2`, [ordemId, oid])).rows[0]

router.get('/', async (req, res) => {
  const status = req.query.status
  if (status && !STATUS.includes(status)) throw new HttpError(400, 'Status inválido.')
  const r = status
    ? await db.query(`${SELECT} where o.oficina_id = $1 and o.status = $2 order by o.numero desc`, [req.user.oficinaId, status])
    : await db.query(`${SELECT} where o.oficina_id = $1 order by o.numero desc`, [req.user.oficinaId])
  res.json(r.rows)
})

router.post('/', async (req, res) => {
  const d = base.parse(req.body)
  await veiculoDaOficina(d.veiculoId, req.user.oficinaId)
  const ordem = await db.tx(async (t) => {
    // Numeração sequencial por oficina, atômica (sem corrida entre requisições).
    const n = (await t.query('update oficinas set prox_os = prox_os + 1 where id = $1 returning prox_os - 1 as numero', [req.user.oficinaId])).rows[0].numero
    const nova = (await t.query(
      `insert into ordens (oficina_id, numero, veiculo_id, relato, status, previsao, mecanico)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [req.user.oficinaId, n, d.veiculoId, d.relato || 'Sem relato informado.', d.status ?? 'avaliacao', d.previsao ?? null, d.mecanico])).rows[0]
    await gravarItens(t, 'os_itens', 'ordem_id', nova.id, d.itens)
    return buscar(t, req.user.oficinaId, nova.id)
  })
  res.status(201).json(ordem)
})

router.get('/:id', async (req, res) => {
  const o = await buscar(db, req.user.oficinaId, id.parse(req.params.id))
  if (!o) throw notFound('Ordem de serviço')
  res.json(o)
})

router.patch('/:id', async (req, res) => {
  const oid = id.parse(req.params.id)
  const d = base.partial().parse(req.body)
  if (d.veiculoId) await veiculoDaOficina(d.veiculoId, req.user.oficinaId)
  const out = await db.tx(async (t) => {
    const r = await t.query(
      `update ordens set veiculo_id = coalesce($3, veiculo_id), relato = coalesce($4, relato),
              mecanico = coalesce($5, mecanico), previsao = coalesce($6, previsao), status = coalesce($7, status)
        where id = $1 and oficina_id = $2 returning id`,
      [oid, req.user.oficinaId, d.veiculoId ?? null, d.relato ?? null, d.mecanico ?? null, d.previsao ?? null, d.status ?? null])
    if (!r.rows[0]) return null
    if (d.itens) await gravarItens(t, 'os_itens', 'ordem_id', oid, d.itens)
    return buscar(t, req.user.oficinaId, oid)
  })
  if (!out) throw notFound('Ordem de serviço')
  res.json(out)
})

router.patch('/:id/status', async (req, res) => {
  const { status } = z.object({ status: z.enum(STATUS) }).parse(req.body)
  const r = await db.query('update ordens set status = $3 where id = $1 and oficina_id = $2 returning id', [id.parse(req.params.id), req.user.oficinaId, status])
  if (!r.rows[0]) throw notFound('Ordem de serviço')
  res.json(await buscar(db, req.user.oficinaId, r.rows[0].id))
})

router.delete('/:id', async (req, res) => {
  const r = await db.query('delete from ordens where id = $1 and oficina_id = $2 returning id', [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw notFound('Ordem de serviço')
  res.status(204).end()
})

export default router
