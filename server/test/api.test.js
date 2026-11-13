process.env.NODE_ENV = 'test'

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { initDb, closeDb } from '../src/db.js'
import { createApp } from '../src/app.js'

let server, base

before(async () => {
  await initDb({ memory: true })
  server = createApp().listen(0)
  base = `http://localhost:${server.address().port}`
})
after(async () => { server.close(); await closeDb() })

async function api(method, path, { token, body } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await r.text()
  return { status: r.status, body: txt ? JSON.parse(txt) : null }
}

const novaOficina = async (sufixo) => {
  const r = await api('POST', '/auth/cadastro', {
    body: { oficina: `Oficina ${sufixo}`, nome: `Dono ${sufixo}`, email: `dono${sufixo}@teste.com`, senha: 'senha-segura-123' },
  })
  assert.equal(r.status, 201)
  return r.body.token
}

test('cadastro, login e sessão', async () => {
  const t = await novaOficina('A')
  const eu = await api('GET', '/auth/eu', { token: t })
  assert.equal(eu.status, 200)
  assert.equal(eu.body.oficina.nome, 'Oficina A')
  assert.equal(eu.body.oficina.plano, 'essencial')
  assert.match(eu.body.oficina.trialAte, /^\d{4}-\d{2}-\d{2}$/)

  const dup = await api('POST', '/auth/cadastro', { body: { oficina: 'Oficina X', nome: 'Xx', email: 'DONOA@teste.com', senha: 'senha-segura-123' } })
  assert.equal(dup.status, 409)

  const curta = await api('POST', '/auth/cadastro', { body: { oficina: 'Oficina Y', nome: 'Yy', email: 'y@teste.com', senha: '123' } })
  assert.equal(curta.status, 400)

  const ok = await api('POST', '/auth/login', { body: { email: 'donoA@teste.com', senha: 'senha-segura-123' } })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.token)
  const ruim = await api('POST', '/auth/login', { body: { email: 'donoA@teste.com', senha: 'errada-errada' } })
  assert.equal(ruim.status, 401)
  const inexistente = await api('POST', '/auth/login', { body: { email: 'nao@existe.com', senha: 'qualquer-senha' } })
  assert.equal(inexistente.status, 401)
  assert.equal(inexistente.body.erro, ruim.body.erro) // não revela se o e-mail existe
})

test('rotas exigem login', async () => {
  for (const p of ['/clientes', '/veiculos', '/ordens', '/orcamentos']) {
    assert.equal((await api('GET', p)).status, 401, p)
  }
  assert.equal((await api('GET', '/clientes', { token: 'lixo' })).status, 401)
})

test('fluxo: cliente → veículo → OS numerada → status → orçamento aprovado vira OS', async () => {
  const t = await novaOficina('B')
  const c = await api('POST', '/clientes', { token: t, body: { nome: 'Marcos Vieira', telefone: '(11) 98812-4410', cidade: 'Guarulhos' } })
  assert.equal(c.status, 201)
  assert.match(c.body.desde, /^\d{4}-\d{2}-\d{2}$/)

  const v = await api('POST', '/veiculos', { token: t, body: { clienteId: c.body.id, placa: 'qwe-4f21', modelo: 'Gol 1.6', ano: 2018, km: 84200, cor: 'Prata' } })
  assert.equal(v.status, 201)
  assert.equal(v.body.placa, 'QWE-4F21')

  const itens = [{ tipo: 'servico', nome: 'Revisão', valor: 380, qtd: 1 }, { tipo: 'peca', nome: 'Filtro', valor: 38.5, qtd: 2 }]
  const o1 = await api('POST', '/ordens', { token: t, body: { veiculoId: v.body.id, relato: 'Barulho', mecanico: 'Edson', itens } })
  const o2 = await api('POST', '/ordens', { token: t, body: { veiculoId: v.body.id, itens: [] } })
  assert.equal(o1.status, 201)
  assert.equal(o1.body.numero, 1)
  assert.equal(o2.body.numero, 2)
  assert.deepEqual(o1.body.itens.map((i) => i.nome), ['Revisão', 'Filtro'])
  assert.equal(o1.body.itens[1].valor, 38.5)

  const s = await api('PATCH', `/ordens/${o1.body.id}/status`, { token: t, body: { status: 'pronto' } })
  assert.equal(s.body.status, 'pronto')
  assert.equal((await api('PATCH', `/ordens/${o1.body.id}/status`, { token: t, body: { status: 'inventado' } })).status, 400)

  const q = await api('POST', '/orcamentos', { token: t, body: { veiculoId: v.body.id, obs: 'Pastilhas', itens: [{ tipo: 'peca', nome: 'Pastilha', valor: 189, qtd: 1 }] } })
  assert.equal(q.status, 201)
  assert.equal(q.body.numero, 1)
  assert.equal((await api('POST', '/orcamentos', { token: t, body: { veiculoId: v.body.id, itens: [] } })).status, 400)

  const ap = await api('POST', `/orcamentos/${q.body.id}/aprovar`, { token: t })
  assert.equal(ap.status, 200)
  assert.equal(ap.body.orcamento.status, 'aprovado')
  const gerada = await api('GET', `/ordens/${ap.body.ordemId}`, { token: t })
  assert.equal(gerada.body.numero, 3)
  assert.equal(gerada.body.status, 'execucao')
  assert.equal(gerada.body.itens[0].nome, 'Pastilha')
  assert.equal((await api('POST', `/orcamentos/${q.body.id}/aprovar`, { token: t })).status, 409) // não gera OS duplicada
  assert.equal((await api('GET', '/ordens', { token: t })).body.length, 3)

  // cliente com veículo não pode ser removido
  assert.equal((await api('DELETE', `/clientes/${c.body.id}`, { token: t })).status, 409)
})

test('isolamento: uma oficina nunca enxerga nem altera dados da outra', async () => {
  const a = await novaOficina('C')
  const b = await novaOficina('D')
  const c = await api('POST', '/clientes', { token: a, body: { nome: 'Cliente da C' } })
  const v = await api('POST', '/veiculos', { token: a, body: { clienteId: c.body.id, placa: 'AAA-0A00', modelo: 'Uno' } })

  assert.equal((await api('GET', '/clientes', { token: b })).body.length, 0)
  assert.equal((await api('GET', `/clientes/${c.body.id}`, { token: b })).status, 404)
  assert.equal((await api('PATCH', `/clientes/${c.body.id}`, { token: b, body: { nome: 'Invadido' } })).status, 404)
  assert.equal((await api('DELETE', `/clientes/${c.body.id}`, { token: b })).status, 404)
  assert.equal((await api('POST', '/veiculos', { token: b, body: { clienteId: c.body.id, placa: 'BBB-0B00', modelo: 'X' } })).status, 400)
  assert.equal((await api('POST', '/ordens', { token: b, body: { veiculoId: v.body.id } })).status, 400)
  assert.equal((await api('GET', `/veiculos/${v.body.id}`, { token: b })).status, 404)
  assert.equal((await api('GET', `/clientes/${c.body.id}`, { token: a })).body.nome, 'Cliente da C')
})

test('validação de entrada', async () => {
  const t = await novaOficina('E')
  assert.equal((await api('POST', '/clientes', { token: t, body: { nome: 'A' } })).status, 400)
  assert.equal((await api('POST', '/clientes', { token: t, body: { nome: 'Fulano', email: 'nao-e-email' } })).status, 400)
  assert.equal((await api('GET', '/clientes/nao-uuid', { token: t })).status, 400)
  assert.equal((await api('GET', '/rota-inexistente', { token: t })).status, 404)
})
