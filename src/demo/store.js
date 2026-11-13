import { useSyncExternalStore } from 'react'
import { api, ApiError } from '../lib/api'
import {
  clientesIniciais, veiculosIniciais, ordensIniciais, orcamentosIniciais,
  agendaInicial, financeiroInicial, totalItens, iso,
} from './data'

// Store em memória (módulo). Sem localStorage, sem backend: recarregar restaura os dados iniciais.
const seed = () => ({
  clientes: structuredClone(clientesIniciais),
  veiculos: structuredClone(veiculosIniciais),
  ordens: structuredClone(ordensIniciais),
  orcamentos: structuredClone(orcamentosIniciais),
  agenda: structuredClone(agendaInicial),
  financeiro: structuredClone(financeiroInicial),
  nextOS: 1049,
  nextOrc: 313,
  // estado de interface compartilhado (permite o "roteiro" da página controlar a demo)
  rota: 'painel',
  modal: null, // { tipo, ...props }
  osAberta: null,
  toast: null,
  tema: 'claro',
  modo: 'demo', // 'demo' (dados fictícios em memória) ou 'real' (dados da API)
  carregando: false,
})

let state = seed()
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const set = (patch) => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; emit() }
let uid = 100
const nid = (p) => `${p}${++uid}`
let toastTimer

export const useDemo = () => useSyncExternalStore(
  (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
  () => state,
)

export const actions = {
  ir: (rota) => set({ rota, osAberta: null }),
  abrirModal: (modal) => set({ modal }),
  fecharModal: () => set({ modal: null }),
  abrirOS: (id) => set({ osAberta: id }),
  fecharOS: () => set({ osAberta: null }),
  alternarTema: () => set((s) => ({ tema: s.tema === 'escuro' ? 'claro' : 'escuro' })),
  restaurar: () => { state = { ...seed(), tema: state.tema }; emit(); actions.avisar('Dados de exemplo restaurados.') },

  limpar: () => {
    state = {
      ...seed(), tema: state.tema, rota: 'clientes',
      clientes: [], veiculos: [], ordens: [], orcamentos: [], agenda: [], financeiro: [],
      nextOS: 1, nextOrc: 1,
    }
    emit()
    actions.avisar('Dados de exemplo removidos. Cadastre o primeiro cliente para começar.')
  },

  avisar: (msg) => {
    set({ toast: msg })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 3200)
  },

  addCliente: (c) => {
    if (state.modo === 'real') return real.addCliente(c)
    const novo = { id: nid('c'), desde: iso(0), ...c }
    set((s) => ({ clientes: [novo, ...s.clientes], modal: null }))
    actions.avisar(`Cliente ${novo.nome.split(' ')[0]} cadastrado.`)
    return novo
  },

  addVeiculo: (v) => {
    if (state.modo === 'real') return real.addVeiculo(v)
    const novo = { id: nid('v'), ...v }
    set((s) => ({ veiculos: [novo, ...s.veiculos], modal: null }))
    actions.avisar(`Veículo ${novo.placa} cadastrado.`)
    return novo
  },

  addOS: ({ veiculoId, relato, itens, previsao, mecanico }) => {
    if (state.modo === 'real') return real.addOS({ veiculoId, relato, itens, previsao, mecanico })
    const os = {
      id: nid('os'), numero: state.nextOS, veiculoId, relato: relato || 'Sem relato informado.',
      status: 'avaliacao', entrada: iso(0), previsao: previsao || iso(2), itens, mecanico: mecanico || 'Edson',
    }
    set((s) => ({ ordens: [os, ...s.ordens], nextOS: s.nextOS + 1, modal: null, rota: 'os', osAberta: os.id }))
    actions.avisar(`OS ${os.numero} aberta.`)
  },

  setStatus: (id, status) => {
    if (state.modo === 'real') return real.setStatus(id, status)
    const os = state.ordens.find((o) => o.id === id)
    if (!os || os.status === status) return
    let financeiro = state.financeiro
    // Ao entregar, a OS gera a conta a receber (fluxo integrado, como numa oficina real).
    if (status === 'entregue' && !financeiro.some((f) => f.osId === id)) {
      const v = state.veiculos.find((x) => x.id === os.veiculoId)
      const c = state.clientes.find((x) => x.id === v?.clienteId)
      financeiro = [{
        id: nid('f'), osId: id, tipo: 'receber', desc: `OS ${os.numero} · ${c?.nome ?? 'Cliente'}`,
        valor: totalItens(os.itens), venc: iso(0), pago: false, forma: 'Pix',
      }, ...financeiro]
    }
    set((s) => ({ ordens: s.ordens.map((o) => (o.id === id ? { ...o, status } : o)), financeiro }))
    actions.avisar(status === 'entregue' ? `OS ${os.numero} entregue — cobrança lançada no financeiro.` : `OS ${os.numero} atualizada.`)
  },

  addOrcamento: ({ veiculoId, itens, obs }) => {
    if (state.modo === 'real') return real.addOrcamento({ veiculoId, itens, obs })
    const o = { id: nid('o'), numero: state.nextOrc, veiculoId, validade: iso(7), status: 'enviado', itens, obs: obs || '' }
    set((s) => ({ orcamentos: [o, ...s.orcamentos], nextOrc: s.nextOrc + 1, modal: null }))
    actions.avisar(`Orçamento ${o.numero} criado e pronto para enviar.`)
  },

  aprovarOrcamento: (id) => {
    if (state.modo === 'real') return real.aprovarOrcamento(id)
    const o = state.orcamentos.find((x) => x.id === id)
    if (!o) return
    const os = {
      id: nid('os'), numero: state.nextOS, veiculoId: o.veiculoId, relato: `Gerada do orçamento ${o.numero}. ${o.obs}`.trim(),
      status: 'execucao', entrada: iso(0), previsao: iso(2), itens: o.itens, mecanico: 'Wesley',
    }
    set((s) => ({
      orcamentos: s.orcamentos.map((x) => (x.id === id ? { ...x, status: 'aprovado' } : x)),
      ordens: [os, ...s.ordens], nextOS: s.nextOS + 1,
    }))
    actions.avisar(`Orçamento aprovado — OS ${os.numero} aberta.`)
  },

  recusarOrcamento: (id) => state.modo === 'real' ? real.recusarOrcamento(id) : set((s) => ({ orcamentos: s.orcamentos.map((x) => (x.id === id ? { ...x, status: 'recusado' } : x)) })),

  addAgenda: (a) => {
    set((s) => ({ agenda: [...s.agenda, { id: nid('a'), duracao: 1, ...a }], modal: null }))
    actions.avisar('Horário reservado na agenda.')
  },

  baixar: (id) => {
    set((s) => ({ financeiro: s.financeiro.map((f) => (f.id === id ? { ...f, pago: true } : f)) }))
    actions.avisar('Baixa registrada.')
  },

  addLancamento: (l) => {
    set((s) => ({ financeiro: [{ id: nid('f'), pago: false, ...l }, ...s.financeiro], modal: null }))
    actions.avisar('Lançamento criado.')
  },
}

// ───────────── Modo real: mesma interface, mas persistindo na API ─────────────
const erro = (e) => actions.avisar(e instanceof ApiError ? e.message : 'Não foi possível concluir. Tente novamente.')
const noInicio = (lista, novo) => [novo, ...lista.filter((x) => x.id !== novo.id)]
const numeroOuNulo = (v) => (v === '' || v == null ? null : Number(v))

const real = {
  async carregar() {
    set({ carregando: true })
    try {
      const [clientes, veiculos, ordens, orcamentos] = await Promise.all([
        api('GET', '/clientes'), api('GET', '/veiculos'), api('GET', '/ordens'), api('GET', '/orcamentos'),
      ])
      set({ clientes, veiculos, ordens, orcamentos, agenda: [], financeiro: [], carregando: false })
    } catch (e) { set({ carregando: false }); erro(e) }
  },

  async addCliente(c) {
    try {
      const novo = await api('POST', '/clientes', c)
      set((s) => ({ clientes: [...s.clientes, novo].sort((a, b) => a.nome.localeCompare(b.nome)), modal: null }))
      actions.avisar(`Cliente ${novo.nome.split(' ')[0]} cadastrado.`)
      return novo
    } catch (e) { erro(e) }
  },

  async addVeiculo(v) {
    try {
      const novo = await api('POST', '/veiculos', { ...v, ano: numeroOuNulo(v.ano), km: numeroOuNulo(v.km) })
      set((s) => ({ veiculos: [...s.veiculos, novo], modal: null }))
      actions.avisar(`Veículo ${novo.placa} cadastrado.`)
      return novo
    } catch (e) { erro(e) }
  },

  async addOS({ veiculoId, relato, itens, previsao, mecanico }) {
    try {
      const os = await api('POST', '/ordens', { veiculoId, relato, itens, previsao: previsao || null, mecanico: mecanico || '' })
      set((s) => ({ ordens: noInicio(s.ordens, os), modal: null, rota: 'os', osAberta: os.id }))
      actions.avisar(`OS ${os.numero} aberta.`)
    } catch (e) { erro(e) }
  },

  async setStatus(id, status) {
    const os = state.ordens.find((o) => o.id === id)
    if (!os || os.status === status) return
    try {
      const nova = await api('PATCH', `/ordens/${id}/status`, { status })
      set((s) => ({ ordens: s.ordens.map((o) => (o.id === id ? nova : o)) }))
      actions.avisar(`OS ${os.numero} atualizada.`)
    } catch (e) { erro(e) }
  },

  async addOrcamento({ veiculoId, itens, obs }) {
    try {
      const o = await api('POST', '/orcamentos', { veiculoId, itens, obs })
      set((s) => ({ orcamentos: noInicio(s.orcamentos, o), modal: null }))
      actions.avisar(`Orçamento ${o.numero} criado e pronto para enviar.`)
    } catch (e) { erro(e) }
  },

  async aprovarOrcamento(id) {
    try {
      const { orcamento, ordemId } = await api('POST', `/orcamentos/${id}/aprovar`)
      const os = await api('GET', `/ordens/${ordemId}`)
      set((s) => ({ orcamentos: s.orcamentos.map((x) => (x.id === id ? orcamento : x)), ordens: noInicio(s.ordens, os) }))
      actions.avisar(`Orçamento aprovado — OS ${os.numero} aberta.`)
    } catch (e) { erro(e) }
  },

  async recusarOrcamento(id) {
    try {
      const o = await api('POST', `/orcamentos/${id}/recusar`)
      set((s) => ({ orcamentos: s.orcamentos.map((x) => (x.id === id ? o : x)) }))
    } catch (e) { erro(e) }
  },
}

/** Liga o app aos dados reais da oficina logada (zera qualquer dado de demonstração). */
export function conectarReal() {
  state = {
    ...seed(), modo: 'real', rota: 'painel', tema: state.tema,
    clientes: [], veiculos: [], ordens: [], orcamentos: [], agenda: [], financeiro: [], nextOS: 1, nextOrc: 1,
  }
  emit()
  return real.carregar()
}
export function desconectarReal() { state = { ...seed(), tema: state.tema }; emit() }

export const seletores = {
  veiculo: (s, id) => s.veiculos.find((v) => v.id === id),
  cliente: (s, id) => s.clientes.find((c) => c.id === id),
  clienteDoVeiculo: (s, vid) => {
    const v = s.veiculos.find((x) => x.id === vid)
    return v ? s.clientes.find((c) => c.id === v.clienteId) : undefined
  },
}
