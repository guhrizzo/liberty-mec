import { useSyncExternalStore } from 'react'
import { api, getToken, setToken } from '../lib/api'

// status: 'carregando' (verificando token) | 'anon' | 'logado' | 'erro' (servidor indisponível)
let state = { status: getToken() ? 'carregando' : 'anon', usuario: null, oficina: null }
const listeners = new Set()
const set = (p) => { state = { ...state, ...p }; listeners.forEach((l) => l()) }

export const useSession = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)

const aplicar = (r) => { setToken(r.token); set({ status: 'logado', usuario: r.usuario, oficina: r.oficina }) }

window.addEventListener('lm:logout', () => set({ status: 'anon', usuario: null, oficina: null }))

let iniciada = false
export const reiniciar = () => { iniciada = false; set({ status: 'carregando' }); return iniciar() }
export async function iniciar() {
  if (iniciada) return
  iniciada = true
  if (!getToken()) return set({ status: 'anon' })
  try {
    const r = await api('GET', '/auth/eu')
    set({ status: 'logado', usuario: r.usuario, oficina: r.oficina })
  } catch (e) {
    // 401: o token já foi limpo, volta ao login. Falha de rede/servidor: mantém o token e mostra opção de tentar de novo.
    set({ status: e.status === 401 ? 'anon' : 'erro' })
  }
}

export const entrar = async (email, senha) => aplicar(await api('POST', '/auth/login', { email, senha }))
export const cadastrar = async (dados) => aplicar(await api('POST', '/auth/cadastro', dados))
export const sair = () => { setToken(null); set({ status: 'anon', usuario: null, oficina: null }) }
