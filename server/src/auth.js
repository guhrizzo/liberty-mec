import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { HttpError } from './http.js'

export const signToken = (u) =>
  jwt.sign({ oficinaId: u.oficina_id, papel: u.papel }, config.jwtSecret, { subject: u.id, expiresIn: config.jwtExpires })

// Exige "Authorization: Bearer <token>" e injeta req.user. Todo dado é filtrado por req.user.oficinaId.
export function requireAuth(req, _res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) throw new HttpError(401, 'Faça login para continuar.')
  try {
    const p = jwt.verify(token, config.jwtSecret)
    req.user = { id: p.sub, oficinaId: p.oficinaId, papel: p.papel }
    next()
  } catch {
    throw new HttpError(401, 'Sessão expirada. Entre novamente.')
  }
}
