import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { HttpError, notFound } from '../http.js'
import { itensSchema, itensJson, gravarItens } from '../lib/itens.js'

const router = Router()
const id = z.uuid()
const STATUS = ['rascunho', 'enviado', 'aprovado', 'recusado']

const SELECT = `select q.id, q.numero, q.veiculo_id as "veiculoId", q.validade::text as validade, q.status, q.obs,
  q.ordem_id as "ordemId", ${itensJson('orcamento_itens', 'orcamento_id', 'q')} as itens
  from orcamentos q`

const base = z.object({
  veiculoId: z.uuid(),
  validade: z.iso.date().nullish(),
  obs: z.string().trim().max(2000).default(''),
  status: z.enum(['rascunho', 'enviado']).optional(),
  itens: itensSchema.default([]),
})

async function veiculoDaOficina(veiculoId, oficinaId) {
  const r = await db.query('select 1 from veiculos where id = $1 and oficina_id = $2', [veiculoId, oficinaId])
  if (!r.rows[0]) throw new HttpError(400, 'Veículo inválido.')
}
const buscar = async (t, oid, qid) =>
  (await t.query(`${SELECT} where q.id = $1 and q.oficina_id = $2`, [qid, oid])).rows[0]

router.get('/', async (req, res) => {
  res.json((await db.query(`${SELECT} where q.oficina_id = $1 order by q.numero desc`, [req.user.oficinaId])).rows)
})

router.post('/', async (req, res) => {
  const d = base.parse(req.body)
  if (!d.itens.length) throw new HttpError(400, 'Adicione ao menos um item ao orçamento.')
  await veiculoDaOficina(d.veiculoId, req.user.oficinaId)
  const q = await db.tx(async (t) => {
    const n = (await t.query('update oficinas set prox_orc = prox_orc + 1 where id = $1 returning prox_orc - 1 as numero', [req.user.oficinaId])).rows[0].numero
    const novo = (await t.query(
      `insert into orcamentos (oficina_id, numero, veiculo_id, validade, status, obs)
       values ($1,$2,$3, coalesce($4::date, current_date + 7), $5, $6) returning id`,
      [req.user.oficinaId, n, d.veiculoId, d.validade ?? null, d.status ?? 'enviado', d.obs])).rows[0]
    await gravarItens(t, 'orcamento_itens', 'orcamento_id', novo.id, d.itens)
    return buscar(t, req.user.oficinaId, novo.id)
  })
  res.status(201).json(q)
})

router.get('/:id', async (req, res) => {
  const q = await buscar(db, req.user.oficinaId, id.parse(req.params.id))
  if (!q) throw notFound('Orçamento')
  res.json(q)
})

router.patch('/:id', async (req, res) => {
  const qid = id.parse(req.params.id)
  const d = base.partial().parse(req.body)
  if (d.veiculoId) await veiculoDaOficina(d.veiculoId, req.user.oficinaId)
  const out = await db.tx(async (t) => {
    const atual = (await t.query('select status from orcamentos where id = $1 and oficina_id = $2 for update', [qid, req.user.oficinaId])).rows[0]
    if (!atual) return null
    if (atual.status === 'aprovado') throw new HttpError(409, 'Orçamento já aprovado não pode ser alterado.')
    await t.query(
      `update orcamentos set veiculo_id = coalesce($3, veiculo_id), validade = coalesce($4::date, validade),
              obs = coalesce($5, obs), status = coalesce($6, status) where id = $1 and oficina_id = $2`,
      [qid, req.user.oficinaId, d.veiculoId ?? null, d.validade ?? null, d.obs ?? null, d.status ?? null])
    if (d.itens) await gravarItens(t, 'orcamento_itens', 'orcamento_id', qid, d.itens)
    return buscar(t, req.user.oficinaId, qid)
  })
  if (!out) throw notFound('Orçamento')
  res.json(out)
})

// Aprovar: gera a OS (em execução) copiando os itens, de forma atômica e uma única vez.
router.post('/:id/aprovar', async (req, res) => {
  const qid = id.parse(req.params.id)
  const out = await db.tx(async (t) => {
    const q = (await t.query('select numero, veiculo_id, status, obs from orcamentos where id = $1 and oficina_id = $2 for update', [qid, req.user.oficinaId])).rows[0]
    if (!q) throw notFound('Orçamento')
    if (q.status === 'aprovado') throw new HttpError(409, 'Orçamento já aprovado.')
    if (q.status === 'recusado') throw new HttpError(409, 'Orçamento recusado não pode ser aprovado.')
    const n = (await t.query('update oficinas set prox_os = prox_os + 1 where id = $1 returning prox_os - 1 as numero', [req.user.oficinaId])).rows[0].numero
    const os = (await t.query(
      `insert into ordens (oficina_id, numero, veiculo_id, relato, status, previsao)
       values ($1,$2,$3,$4,'execucao', current_date + 2) returning id`,
      [req.user.oficinaId, n, q.veiculo_id, `Gerada do orçamento ${q.numero}. ${q.obs}`.trim()])).rows[0]
    await t.query(
      `insert into os_itens (ordem_id, pos, tipo, nome, valor, qtd)
       select $1, pos, tipo, nome, valor, qtd from orcamento_itens where orcamento_id = $2`, [os.id, qid])
    await t.query("update orcamentos set status = 'aprovado', ordem_id = $3 where id = $1 and oficina_id = $2", [qid, req.user.oficinaId, os.id])
    return { orcamento: await buscar(t, req.user.oficinaId, qid), ordemId: os.id }
  })
  res.json(out)
})

router.post('/:id/recusar', async (req, res) => {
  const r = await db.query(
    "update orcamentos set status = 'recusado' where id = $1 and oficina_id = $2 and status <> 'aprovado' returning id",
    [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw new HttpError(409, 'Orçamento não encontrado ou já aprovado.')
  res.json(await buscar(db, req.user.oficinaId, r.rows[0].id))
})

router.delete('/:id', async (req, res) => {
  const r = await db.query("delete from orcamentos where id = $1 and oficina_id = $2 and status <> 'aprovado' returning id", [id.parse(req.params.id), req.user.oficinaId])
  if (!r.rows[0]) throw new HttpError(409, 'Orçamento não encontrado ou já aprovado.')
  res.status(204).end()
})

export default router
