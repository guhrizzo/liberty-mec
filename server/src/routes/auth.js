import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { db } from '../db.js'
import { signToken, requireAuth } from '../auth.js'
import { HttpError } from '../http.js'

const router = Router()

// Freia tentativa de força bruta em login/cadastro (por IP).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
})

const cadastro = z.object({
  oficina: z.string().trim().min(2).max(120),
  nome: z.string().trim().min(2).max(120),
  email: z.email().max(160).transform((s) => s.toLowerCase()),
  senha: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(100),
})
const login = z.object({ email: z.email().transform((s) => s.toLowerCase()), senha: z.string().min(1).max(100) })

const publico = (u, o) => ({
  usuario: { id: u.id, nome: u.nome, email: u.email, papel: u.papel },
  oficina: { id: o.id, nome: o.nome, plano: o.plano, trialAte: o.trial_ate },
})

router.post('/cadastro', limiter, async (req, res) => {
  const d = cadastro.parse(req.body)
  const hash = await bcrypt.hash(d.senha, 10)
  const out = await db.tx(async (t) => {
    const dup = await t.query('select 1 from usuarios where lower(email) = $1', [d.email])
    if (dup.rows.length) throw new HttpError(409, 'Já existe uma conta com este e-mail.')
    const o = (await t.query(
      "insert into oficinas (nome) values ($1) returning id, nome, plano, trial_ate::text as trial_ate", [d.oficina])).rows[0]
    const u = (await t.query(
      'insert into usuarios (oficina_id, nome, email, senha_hash) values ($1, $2, $3, $4) returning id, oficina_id, nome, email, papel',
      [o.id, d.nome, d.email, hash])).rows[0]
    return { u, o }
  })
  res.status(201).json({ token: signToken(out.u), ...publico(out.u, out.o) })
})

router.post('/login', limiter, async (req, res) => {
  const d = login.parse(req.body)
  const r = await db.query(
    `select u.id, u.oficina_id, u.nome, u.email, u.papel, u.senha_hash,
            o.nome as oficina_nome, o.plano, o.trial_ate::text as trial_ate
       from usuarios u join oficinas o on o.id = u.oficina_id where lower(u.email) = $1`, [d.email])
  const u = r.rows[0]
  // Mesmo tempo/resposta para e-mail inexistente e senha errada (não revela quais e-mails existem).
  const ok = await bcrypt.compare(d.senha, u?.senha_hash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin')
  if (!u || !ok) throw new HttpError(401, 'E-mail ou senha incorretos.')
  res.json({ token: signToken(u), ...publico(u, { id: u.oficina_id, nome: u.oficina_nome, plano: u.plano, trial_ate: u.trial_ate }) })
})

router.get('/eu', requireAuth, async (req, res) => {
  const r = await db.query(
    `select u.id, u.oficina_id, u.nome, u.email, u.papel, o.nome as oficina_nome, o.plano, o.trial_ate::text as trial_ate
       from usuarios u join oficinas o on o.id = u.oficina_id where u.id = $1 and u.oficina_id = $2`,
    [req.user.id, req.user.oficinaId])
  const u = r.rows[0]
  if (!u) throw new HttpError(401, 'Sessão inválida.')
  res.json(publico(u, { id: u.oficina_id, nome: u.oficina_nome, plano: u.plano, trial_ate: u.trial_ate }))
})

export default router
