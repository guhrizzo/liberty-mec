import { useMemo, useState } from 'react'
import { Plus, Search, ArrowRight, X, Check, AlertTriangle, CalendarClock, Wrench, Phone, Mail } from 'lucide-react'
import { PageHead, Plate, StatusBadge, Badge, Empty } from './ui'
import { actions, useDemo, seletores } from './store'
import { STATUS, brl, dataCurta, iso, semanas, totalItens, statusOf } from './data'

const hoje = iso(0)

/* ───────────── Painel ───────────── */
export function Painel() {
  const s = useDemo()
  const abertas = s.ordens.filter((o) => o.status !== 'entregue')
  const recebido = s.financeiro.filter((f) => f.tipo === 'receber' && f.pago).reduce((a, f) => a + f.valor, 0)
  const aReceber = s.financeiro.filter((f) => f.tipo === 'receber' && !f.pago).reduce((a, f) => a + f.valor, 0)
  const aPagar = s.financeiro.filter((f) => f.tipo === 'pagar' && !f.pago).reduce((a, f) => a + f.valor, 0)
  const ticket = s.ordens.length ? s.ordens.reduce((a, o) => a + totalItens(o.itens), 0) / s.ordens.length : 0
  const atrasadas = abertas.filter((o) => o.previsao < hoje)
  const venceHoje = s.financeiro.filter((f) => !f.pago && f.venc <= iso(1))
  const agendaHoje = s.agenda.filter((a) => a.data === hoje).sort((a, b) => a.hora.localeCompare(b.hora))
  const max = Math.max(...semanas.map((w) => w.v))
  const contagem = STATUS.filter((x) => x.id !== 'entregue').map((x) => ({ ...x, n: s.ordens.filter((o) => o.status === x.id).length }))
  const totalPatio = contagem.reduce((a, c) => a + c.n, 0) || 1

  return (
    <div className="d-page">
      <PageHead title="Painel" sub="Visão do dia da oficina">
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'os' })}><Plus size={16} /> Nova OS</button>
      </PageHead>

      <dl className="d-kpis">
        <div><dt>Recebido no mês</dt><dd className="mono">{brl(recebido)}</dd></div>
        <div><dt>A receber</dt><dd className="mono">{brl(aReceber)}</dd></div>
        <div><dt>OS no pátio</dt><dd className="mono">{abertas.length}</dd></div>
        <div><dt>Ticket médio</dt><dd className="mono">{brl(ticket)}</dd></div>
      </dl>

      <section className="d-block">
        <header><h3>Pátio agora</h3><button className="d-link" onClick={() => actions.ir('os')}>Ver ordens <ArrowRight size={14} /></button></header>
        <div className="d-pipe" role="img" aria-label={contagem.map((c) => `${c.label}: ${c.n}`).join(', ')}>
          {contagem.map((c) => c.n > 0 && <span key={c.id} className={`d-pipe__seg tone-${c.tone}`} style={{ flexGrow: c.n / totalPatio }} />)}
        </div>
        <ul className="d-pipe__legend">
          {contagem.map((c) => <li key={c.id}><i className={`dot tone-${c.tone}`} />{c.label}<b className="mono">{c.n}</b></li>)}
        </ul>
      </section>

      <div className="d-cols">
        <section className="d-block">
          <header><h3>Faturamento semanal</h3><span className="d-muted">últimas 8 semanas</span></header>
          <svg className="d-chart" viewBox="0 0 320 130" role="img" aria-label="Faturamento semanal em reais">
            {semanas.map((w, i) => {
              const h = (w.v / max) * 96
              const last = i === semanas.length - 1
              return (
                <g key={w.rot}>
                  <rect x={10 + i * 38} y={104 - h} width="24" height={h} rx="3" className={last ? 'bar bar--now' : 'bar'}><title>{w.rot}: {brl(w.v)}</title></rect>
                  <text x={22 + i * 38} y="122" textAnchor="middle">{w.rot}</text>
                </g>
              )
            })}
          </svg>
        </section>

        <section className="d-block">
          <header><h3>Atenção</h3></header>
          <ul className="d-alerts">
            {atrasadas.map((o) => (
              <li key={o.id}><AlertTriangle size={16} className="tone-red-t" />
                <button className="d-link d-link--plain" onClick={() => { actions.ir('os'); actions.abrirOS(o.id) }}>OS {o.numero} passou da previsão ({dataCurta(o.previsao)})</button></li>
            ))}
            {venceHoje.map((f) => <li key={f.id}><CalendarClock size={16} className="tone-amber-t" /><button className="d-link d-link--plain" onClick={() => actions.ir('financeiro')}>{f.desc} · {brl(f.valor)} vence {f.venc <= hoje ? 'hoje' : 'amanhã'}</button></li>)}
            {atrasadas.length + venceHoje.length === 0 && <li className="d-muted">Tudo em dia por aqui.</li>}
          </ul>
        </section>
      </div>

      <section className="d-block">
        <header><h3>Agenda de hoje</h3><button className="d-link" onClick={() => actions.ir('agenda')}>Abrir agenda <ArrowRight size={14} /></button></header>
        {agendaHoje.length === 0 ? <Empty>Sem horários marcados para hoje.</Empty> : (
          <ul className="d-timeline">
            {agendaHoje.map((a) => {
              const v = seletores.veiculo(s, a.veiculoId)
              return <li key={a.id}><time className="mono">{a.hora}</time><span>{a.servico}</span><Plate value={v?.placa} /></li>
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ───────────── Clientes ───────────── */
export function Clientes() {
  const s = useDemo()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return s.clientes.filter((c) => !t || c.nome.toLowerCase().includes(t) || c.telefone.includes(t) ||
      s.veiculos.some((v) => v.clienteId === c.id && v.placa.toLowerCase().includes(t)))
  }, [q, s.clientes, s.veiculos])
  const cli = sel && s.clientes.find((c) => c.id === sel)

  return (
    <div className="d-page">
      <PageHead title="Clientes" sub={`${s.clientes.length} cadastrados`}>
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'cliente' })}><Plus size={16} /> Novo cliente</button>
      </PageHead>
      <div className="d-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone ou placa" aria-label="Buscar clientes" /></div>
      <div className="d-tablewrap">
        <table className="d-table">
          <thead><tr><th>Cliente</th><th className="hide-sm">Telefone</th><th>Veículos</th><th className="hide-sm">Cliente desde</th></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} tabIndex={0} onClick={() => setSel(c.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(c.id))} className="is-click">
                <td><b>{c.nome}</b><small>{c.cidade}</small></td>
                <td className="hide-sm mono">{c.telefone}</td>
                <td><span className="d-plates">{s.veiculos.filter((v) => v.clienteId === c.id).map((v) => <Plate key={v.id} value={v.placa} />)}</span></td>
                <td className="hide-sm">{dataCurta(c.desde)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <Empty>Nenhum cliente encontrado para “{q}”.</Empty>}
      </div>

      {cli && (
        <aside className="d-drawer" aria-label={`Ficha de ${cli.nome}`}>
          <header><h3>{cli.nome}</h3><button className="d-icon-btn" onClick={() => setSel(null)} aria-label="Fechar ficha"><X size={18} /></button></header>
          <div className="d-drawer__body">
            <p className="d-contact"><Phone size={14} /> {cli.telefone}</p>
            {cli.email && <p className="d-contact"><Mail size={14} /> {cli.email}</p>}
            <h4>Veículos</h4>
            {s.veiculos.filter((v) => v.clienteId === cli.id).map((v) => (
              <div className="d-line" key={v.id}><Plate value={v.placa} /><span>{v.modelo} · {v.ano}</span>
                <button className="d-link" onClick={() => actions.abrirModal({ tipo: 'os', veiculoId: v.id })}>Abrir OS</button></div>
            ))}
            <button className="d-btn d-btn--soft" onClick={() => actions.abrirModal({ tipo: 'veiculo', clienteId: cli.id })}><Plus size={15} /> Adicionar veículo</button>
            <h4>Histórico de serviços</h4>
            {s.ordens.filter((o) => seletores.veiculo(s, o.veiculoId)?.clienteId === cli.id).map((o) => (
              <div className="d-line" key={o.id}><b className="mono">#{o.numero}</b><span>{o.relato}</span><StatusBadge id={o.status} /></div>
            ))}
            {!s.ordens.some((o) => seletores.veiculo(s, o.veiculoId)?.clienteId === cli.id) && <p className="d-muted">Ainda sem serviços registrados.</p>}
          </div>
        </aside>
      )}
    </div>
  )
}

/* ───────────── Veículos ───────────── */
export function Veiculos() {
  const s = useDemo()
  const [q, setQ] = useState('')
  const lista = s.veiculos.filter((v) => {
    const t = q.trim().toLowerCase()
    const c = seletores.cliente(s, v.clienteId)
    return !t || v.placa.toLowerCase().includes(t) || v.modelo.toLowerCase().includes(t) || c?.nome.toLowerCase().includes(t)
  })
  return (
    <div className="d-page">
      <PageHead title="Veículos" sub={`${s.veiculos.length} na base · histórico completo por placa`}>
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'veiculo' })}><Plus size={16} /> Novo veículo</button>
      </PageHead>
      <div className="d-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por placa, modelo ou proprietário" aria-label="Buscar veículos" /></div>
      <div className="d-tablewrap">
        <table className="d-table">
          <thead><tr><th>Placa</th><th>Veículo</th><th className="hide-sm">Proprietário</th><th className="hide-sm num">Km</th><th /></tr></thead>
          <tbody>
            {lista.map((v) => {
              const c = seletores.cliente(s, v.clienteId)
              const n = s.ordens.filter((o) => o.veiculoId === v.id).length
              return (
                <tr key={v.id}>
                  <td><Plate value={v.placa} /></td>
                  <td><b>{v.modelo}</b><small>{v.ano} · {v.cor} · {n} {n === 1 ? 'serviço' : 'serviços'}</small></td>
                  <td className="hide-sm">{c?.nome}</td>
                  <td className="hide-sm num mono">{v.km.toLocaleString('pt-BR')}</td>
                  <td className="act"><button className="d-btn d-btn--soft d-btn--sm" onClick={() => actions.abrirModal({ tipo: 'os', veiculoId: v.id })}>Abrir OS</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lista.length === 0 && <Empty>Nenhum veículo encontrado.</Empty>}
      </div>
    </div>
  )
}

/* ───────────── Ordens de serviço ───────────── */
export function Ordens() {
  const s = useDemo()
  const [filtro, setFiltro] = useState('todas')
  const lista = s.ordens.filter((o) => filtro === 'todas' ? true : filtro === 'abertas' ? o.status !== 'entregue' : o.status === filtro)
  const os = s.osAberta && s.ordens.find((o) => o.id === s.osAberta)
  const filtros = [['todas', 'Todas'], ['abertas', 'Em aberto'], ...STATUS.map((x) => [x.id, x.label])]

  return (
    <div className="d-page">
      <PageHead title="Ordens de serviço" sub={`${s.ordens.filter((o) => o.status !== 'entregue').length} em aberto`}>
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'os' })}><Plus size={16} /> Nova OS</button>
      </PageHead>
      <div className="d-chips" role="tablist" aria-label="Filtrar por status">
        {filtros.map(([id, l]) => <button key={id} role="tab" aria-selected={filtro === id} className={filtro === id ? 'on' : ''} onClick={() => setFiltro(id)}>{l}</button>)}
      </div>
      <div className="d-tablewrap">
        <table className="d-table">
          <thead><tr><th>OS</th><th>Veículo</th><th className="hide-sm">Previsão</th><th>Status</th><th className="num">Total</th></tr></thead>
          <tbody>
            {lista.map((o) => {
              const v = seletores.veiculo(s, o.veiculoId)
              const c = seletores.cliente(s, v?.clienteId)
              const atraso = o.status !== 'entregue' && o.previsao < hoje
              return (
                <tr key={o.id} tabIndex={0} className={`is-click ${s.osAberta === o.id ? 'is-sel' : ''}`} onClick={() => actions.abrirOS(o.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), actions.abrirOS(o.id))}>
                  <td className="mono"><b>#{o.numero}</b></td>
                  <td><b>{v?.modelo}</b><small>{v?.placa} · {c?.nome}</small></td>
                  <td className="hide-sm">{atraso ? <Badge tone="red">Atrasada · {dataCurta(o.previsao)}</Badge> : dataCurta(o.previsao)}</td>
                  <td><StatusBadge id={o.status} /></td>
                  <td className="num mono">{brl(totalItens(o.itens))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lista.length === 0 && <Empty>Nenhuma OS neste filtro.</Empty>}
      </div>
      {os && <OSDrawer os={os} />}
    </div>
  )
}

function OSDrawer({ os }) {
  const s = useDemo()
  const v = seletores.veiculo(s, os.veiculoId)
  const c = seletores.cliente(s, v?.clienteId)
  const idx = STATUS.findIndex((x) => x.id === os.status)
  const prox = STATUS[idx + 1]
  return (
    <aside className="d-drawer" aria-label={`Ordem de serviço ${os.numero}`}>
      <header>
        <div><small className="mono">OS #{os.numero}</small><h3>{v?.modelo}</h3></div>
        <button className="d-icon-btn" onClick={actions.fecharOS} aria-label="Fechar OS"><X size={18} /></button>
      </header>
      <div className="d-drawer__body">
        <div className="d-line"><Plate value={v?.placa} /><span>{c?.nome}</span></div>
        <p className="d-quote">“{os.relato}”</p>

        <h4>Andamento</h4>
        <ol className="d-steps" aria-label="Etapas">
          {STATUS.map((x, i) => (
            <li key={x.id} className={i < idx ? 'done' : i === idx ? 'now' : ''}>
              <button onClick={() => actions.setStatus(os.id, x.id)} aria-current={i === idx ? 'step' : undefined}>
                <span className="d-steps__dot">{i < idx ? <Check size={11} strokeWidth={3} /> : i + 1}</span>{x.label}
              </button>
            </li>
          ))}
        </ol>
        {prox ? (
          <button className="d-btn d-btn--primary d-btn--block" onClick={() => actions.setStatus(os.id, prox.id)}>
            Avançar para “{prox.label}” <ArrowRight size={16} />
          </button>
        ) : <p className="d-done"><Check size={15} /> Veículo entregue. Cobrança lançada no financeiro.</p>}

        <h4>Serviços e peças</h4>
        <ul className="d-lines">
          {os.itens.map((i) => <li key={i.id}><span>{i.qtd > 1 ? `${i.qtd}× ` : ''}{i.nome}</span><b className="mono">{brl(i.valor * i.qtd)}</b></li>)}
          {os.itens.length === 0 && <li className="d-muted">Sem itens lançados.</li>}
        </ul>
        <div className="d-itens__total"><span>Total</span><b className="mono">{brl(totalItens(os.itens))}</b></div>
        <p className="d-meta"><Wrench size={13} /> {os.mecanico} · entrada {dataCurta(os.entrada)} · previsão {dataCurta(os.previsao)}</p>
      </div>
    </aside>
  )
}

/* ───────────── Orçamentos ───────────── */
const ORC = { enviado: ['amber', 'Aguardando cliente'], aprovado: ['green', 'Aprovado'], recusado: ['red', 'Recusado'] }
export function Orcamentos() {
  const s = useDemo()
  return (
    <div className="d-page">
      <PageHead title="Orçamentos" sub="Aprovou? Vira ordem de serviço com um clique">
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'orcamento' })}><Plus size={16} /> Novo orçamento</button>
      </PageHead>
      <div className="d-tablewrap">
        <table className="d-table">
          <thead><tr><th>Nº</th><th>Veículo</th><th className="hide-sm">Validade</th><th>Status</th><th className="num">Total</th><th /></tr></thead>
          <tbody>
            {s.orcamentos.map((o) => {
              const v = seletores.veiculo(s, o.veiculoId)
              const c = seletores.cliente(s, v?.clienteId)
              const [tone, label] = ORC[o.status]
              return (
                <tr key={o.id}>
                  <td className="mono"><b>#{o.numero}</b></td>
                  <td><b>{v?.modelo}</b><small>{c?.nome}</small></td>
                  <td className="hide-sm">{dataCurta(o.validade)}</td>
                  <td><Badge tone={tone}>{label}</Badge></td>
                  <td className="num mono">{brl(totalItens(o.itens))}</td>
                  <td className="act">
                    {o.status === 'enviado' && (
                      <span className="d-actions">
                        <button className="d-btn d-btn--primary d-btn--sm" onClick={() => actions.aprovarOrcamento(o.id)}>Aprovar</button>
                        <button className="d-btn d-btn--ghost d-btn--sm" onClick={() => actions.recusarOrcamento(o.id)}>Recusar</button>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ───────────── Agenda ───────────── */
const HORAS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function Agenda() {
  const s = useDemo()
  const dias = Array.from({ length: 6 }, (_, i) => {
    const data = iso(i)
    const d = new Date(data + 'T12:00:00')
    return { data, rot: DIAS[d.getDay()], n: d.getDate() }
  })
  const em = (data, hora) => s.agenda.filter((a) => a.data === data && a.hora === hora)
  const card = (a) => {
    const v = seletores.veiculo(s, a.veiculoId)
    return <div className="d-ev" key={a.id}><b>{a.servico}</b><small>{v?.placa}</small></div>
  }
  return (
    <div className="d-page">
      <PageHead title="Agenda" sub="Próximos 6 dias · clique num horário livre para reservar">
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'agenda' })}><Plus size={16} /> Agendar</button>
      </PageHead>

      <div className="d-grid" role="grid" aria-label="Agenda semanal">
        <div className="d-grid__corner" />
        {dias.map((d) => <div key={d.data} className={`d-grid__day ${d.data === hoje ? 'today' : ''}`}><span>{d.rot}</span><b>{d.n}</b></div>)}
        {HORAS.map((h) => (
          <div className="d-grid__row" key={h} role="row">
            <time className="mono">{h}</time>
            {dias.map((d) => {
              const evs = em(d.data, h)
              return evs.length ? <div key={d.data} className="d-grid__cell has" role="gridcell">{evs.map(card)}</div> : (
                <button key={d.data} className="d-grid__cell free" role="gridcell" onClick={() => actions.abrirModal({ tipo: 'agenda', data: d.data, hora: h })}
                  aria-label={`Reservar ${d.rot} dia ${d.n} às ${h}`}><Plus size={13} /></button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="d-agenda-list">
        {dias.map((d) => {
          const evs = s.agenda.filter((a) => a.data === d.data).sort((a, b) => a.hora.localeCompare(b.hora))
          return (
            <section key={d.data} className="d-block">
              <header><h3>{d.data === hoje ? 'Hoje' : `${d.rot} ${d.n}`}</h3></header>
              {evs.length ? <ul className="d-timeline">{evs.map((a) => <li key={a.id}><time className="mono">{a.hora}</time><span>{a.servico}</span><Plate value={seletores.veiculo(s, a.veiculoId)?.placa} /></li>)}</ul> : <p className="d-muted">Livre.</p>}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────── Financeiro ───────────── */
export function Financeiro() {
  const s = useDemo()
  const [aba, setAba] = useState('receber')
  const lista = s.financeiro.filter((f) => f.tipo === aba).sort((a, b) => Number(a.pago) - Number(b.pago) || a.venc.localeCompare(b.venc))
  const soma = (tipo, pago) => s.financeiro.filter((f) => f.tipo === tipo && f.pago === pago).reduce((a, f) => a + f.valor, 0)
  const saldo = soma('receber', true) - soma('pagar', true)
  return (
    <div className="d-page">
      <PageHead title="Financeiro" sub="Contas a receber e a pagar">
        <button className="d-btn d-btn--primary" onClick={() => actions.abrirModal({ tipo: 'lancamento' })}><Plus size={16} /> Lançamento</button>
      </PageHead>
      <dl className="d-kpis">
        <div><dt>Saldo realizado</dt><dd className="mono">{brl(saldo)}</dd></div>
        <div><dt>A receber</dt><dd className="mono">{brl(soma('receber', false))}</dd></div>
        <div><dt>A pagar</dt><dd className="mono">{brl(soma('pagar', false))}</dd></div>
        <div><dt>Projeção</dt><dd className="mono">{brl(saldo + soma('receber', false) - soma('pagar', false))}</dd></div>
      </dl>
      <div className="d-chips" role="tablist">
        {[['receber', 'A receber'], ['pagar', 'A pagar']].map(([id, l]) => <button key={id} role="tab" aria-selected={aba === id} className={aba === id ? 'on' : ''} onClick={() => setAba(id)}>{l}</button>)}
      </div>
      <div className="d-tablewrap">
        <table className="d-table">
          <thead><tr><th>Descrição</th><th className="hide-sm">Vencimento</th><th className="hide-sm">Forma</th><th className="num">Valor</th><th /></tr></thead>
          <tbody>
            {lista.map((f) => {
              const venc = !f.pago && f.venc < hoje
              return (
                <tr key={f.id}>
                  <td><b>{f.desc}</b><small className="show-sm">{dataCurta(f.venc)} · {f.forma}</small></td>
                  <td className="hide-sm">{venc ? <Badge tone="red">Vencida · {dataCurta(f.venc)}</Badge> : dataCurta(f.venc)}</td>
                  <td className="hide-sm">{f.forma}</td>
                  <td className="num mono">{brl(f.valor)}</td>
                  <td className="act">{f.pago ? <Badge tone="green">{aba === 'receber' ? 'Recebido' : 'Pago'}</Badge> :
                    <button className="d-btn d-btn--soft d-btn--sm" onClick={() => actions.baixar(f.id)}>Dar baixa</button>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
