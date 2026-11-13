// Cliente da API do Liberty Mec. Em produção defina VITE_API_URL (endereço da API na Render).
const BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')).replace(/\/$/, '')
const KEY = 'lm_token'

export const apiConfigurada = Boolean(BASE)

export const getToken = () => { try { return localStorage.getItem(KEY) } catch { return null } }
export const setToken = (t) => {
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) } catch { /* navegação privada: segue sem persistir */ }
}

export class ApiError extends Error {
  constructor(status, message, campos) { super(message); this.status = status; this.campos = campos }
}

// A API gratuita da Render "dorme" e pode levar ~30 s na primeira chamada: timeout generoso.
export async function api(method, path, body) {
  if (!BASE) throw new ApiError(0, 'A API ainda não foi configurada neste site.')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 60_000)
  const token = getToken()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.')
  } finally {
    clearTimeout(timer)
  }

  const txt = await res.text()
  let data = null
  try { data = txt ? JSON.parse(txt) : null } catch { /* resposta sem JSON */ }

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      setToken(null)
      window.dispatchEvent(new Event('lm:logout')) // sessão expirou: o app volta para o login
    }
    const campo = data?.campos?.[0]
    throw new ApiError(res.status, campo ? `${campo.mensagem}` : (data?.erro || 'Algo deu errado. Tente novamente.'), data?.campos)
  }
  return data
}
