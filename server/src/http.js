import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export const notFound = (what = 'Registro') => new HttpError(404, `${what} não encontrado.`)

// Middleware final: converte erros conhecidos em respostas JSON sem vazar detalhes internos.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ erro: err.message })
  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      campos: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    })
  }
  if (err?.code === '23503') return res.status(409).json({ erro: 'Este registro está em uso e não pode ser removido.' })
  if (err?.code === '23505') return res.status(409).json({ erro: 'Já existe um registro com esses dados.' })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' })
  console.error(err)
  res.status(500).json({ erro: 'Erro interno. Tente novamente.' })
}
