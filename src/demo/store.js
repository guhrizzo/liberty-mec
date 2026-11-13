import { useSyncExternalStore } from 'react'
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
    const novo = { id: nid('c'), desde: iso(0), ...c }
    set((s) => ({ clientes: [novo, ...s.clientes], modal: null }))
    actions.avisar(`Cliente ${novo.nome.split(' ')[0]} cadastrado.`)
    return novo
  },

  addVeiculo: (v) => {
    const novo = { id: nid('v'), ...v }
    set((s) => ({ veiculos: [novo, ...s.veiculos], modal: null }))
    actions.avisar(`Veículo ${novo.placa} cadastrado.`)
    return novo
  },

  addOS: ({ veiculoId, relato, itens, previsao, mecanico }) => {
    const os = {
      id: nid('os'), numero: state.nextOS, veiculoId, relato: relato || 'Sem relato informado.',
      status: 'avaliacao', entrada: iso(0), previsao: previsao || iso(2), itens, mecanico: mecanico || 'Edson',
    }
    set((s) => ({ ordens: [os, ...s.ordens], nextOS: s.nextOS + 1, modal: null, rota: 'os', osAberta: os.id }))
    actions.avisar(`OS ${os.numero} aberta.`)
  },

  setStatus: (id, status) => {
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
    const o = { id: nid('o'), numero: state.nextOrc, veiculoId, validade: iso(7), status: 'enviado', itens, obs: obs || '' }
    set((s) => ({ orcamentos: [o, ...s.orcamentos], nextOrc: s.nextOrc + 1, modal: null }))
    actions.avisar(`Orçamento ${o.numero} criado e pronto para enviar.`)
  },

  aprovarOrcamento: (id) => {
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

  recusarOrcamento: (id) => set((s) => ({ orcamentos: s.orcamentos.map((x) => (x.id === id ? { ...x, status: 'recusado' } : x)) })),

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

export const seletores = {
  veiculo: (s, id) => s.veiculos.find((v) => v.id === id),
  cliente: (s, id) => s.clientes.find((c) => c.id === id),
  clienteDoVeiculo: (s, vid) => {
    const v = s.veiculos.find((x) => x.id === vid)
    return v ? s.clientes.find((c) => c.id === v.clienteId) : undefined
  },
}
