import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Field } from './ui'
import { actions, useDemo } from './store'
import { CATALOGO, brl, iso, totalItens } from './data'

const maskFone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const maskPlaca = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7).replace(/^([A-Z]{3})(\d)/, '$1-$2')

function Actions({ onCancel, submitLabel, disabled }) {
  return (
    <>
      <button type="button" className="d-btn d-btn--ghost" onClick={onCancel}>Cancelar</button>
      <button type="submit" form="d-form" className="d-btn d-btn--primary" disabled={disabled}>{submitLabel}</button>
    </>
  )
}

function FormModal({ title, onSubmit, submitLabel, disabled, children, wide }) {
  const close = actions.fecharModal
  return (
    <Modal title={title} onClose={close} wide={wide}
      footer={<Actions onCancel={close} submitLabel={submitLabel} disabled={disabled} />}>
      <form id="d-form" onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="d-form">{children}</form>
    </Modal>
  )
}
export function ModalCliente() {
  const [f, setF] = useState({ nome: '', telefone: '', email: '', cidade: '' })
  const ok = f.nome.trim().length > 2 && f.telefone.replace(/\D/g, '').length >= 10
  return (
    <FormModal title="Novo cliente" submitLabel="Cadastrar cliente" disabled={!ok}
      onSubmit={() => ok && actions.addCliente({ ...f, nome: f.nome.trim() })}>
      <Field label="Nome completo ou razão social">
        <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Luciana Prado" autoComplete="off" />
      </Field>
      <div className="d-row">
        <Field label="WhatsApp / telefone">
          <input value={f.telefone} inputMode="tel" onChange={(e) => setF({ ...f, telefone: maskFone(e.target.value) })} placeholder="(11) 90000-0000" />
        </Field>
        <Field label="Cidade">
          <input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="São Paulo" />
        </Field>
      </div>
      <Field label="E-mail" hint="Opcional. Usado para enviar orçamentos e comprovantes.">
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="cliente@email.com" />
      </Field>
    </FormModal>
  )
}

export function ModalVeiculo({ clienteId }) {
  const s = useDemo()
  const [f, setF] = useState({ clienteId: clienteId || s.clientes[0]?.id, placa: '', modelo: '', ano: '', km: '', cor: '' })
  const ok = f.placa.length >= 7 && f.modelo.trim().length > 1
  return (
    <FormModal title="Novo veículo" submitLabel="Cadastrar veículo" disabled={!ok}
      onSubmit={() => ok && actions.addVeiculo({ ...f, ano: Number(f.ano) || 0, km: Number(f.km) || 0 })}>
      <Field label="Proprietário">
        <select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })}>
          {s.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </Field>
      <div className="d-row">
        <Field label="Placa">
          <input value={f.placa} onChange={(e) => setF({ ...f, placa: maskPlaca(e.target.value) })} placeholder="ABC-1D23" className="mono" />
        </Field>
        <Field label="Cor"><input value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} placeholder="Prata" /></Field>
      </div>
      <Field label="Modelo"><input value={f.modelo} onChange={(e) => setF({ ...f, modelo: e.target.value })} placeholder="Ex.: Fiat Argo Drive 1.3" /></Field>
      <div className="d-row">
        <Field label="Ano"><input inputMode="numeric" value={f.ano} onChange={(e) => setF({ ...f, ano: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="2021" /></Field>
        <Field label="Quilometragem"><input inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, '').slice(0, 7) })} placeholder="45000" /></Field>
      </div>
    </FormModal>
  )
}

function ItensEditor({ itens, setItens }) {
  const [sel, setSel] = useState(CATALOGO[0].id)
  const add = () => {
    const c = CATALOGO.find((x) => x.id === sel)
    setItens((l) => {
      const i = l.findIndex((x) => x.id === c.id)
      return i >= 0 ? l.map((x, k) => (k === i ? { ...x, qtd: x.qtd + 1 } : x)) : [...l, { ...c, qtd: 1 }]
    })
  }
  return (
    <div className="d-itens">
      <div className="d-itens__add">
        <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Serviço ou peça">
          <optgroup label="Serviços">{CATALOGO.filter((c) => c.tipo === 'servico').map((c) => <option key={c.id} value={c.id}>{c.nome} — {brl(c.valor)}</option>)}</optgroup>
          <optgroup label="Peças">{CATALOGO.filter((c) => c.tipo === 'peca').map((c) => <option key={c.id} value={c.id}>{c.nome} — {brl(c.valor)}</option>)}</optgroup>
        </select>
        <button type="button" className="d-btn d-btn--soft" onClick={add}><Plus size={16} /> Adicionar</button>
      </div>
      {itens.length === 0 ? <p className="d-muted">Nenhum item ainda. Adicione serviços e peças.</p> : (
        <ul className="d-itens__list">
          {itens.map((i) => (
            <li key={i.id}>
              <span>{i.nome}<small>{i.tipo === 'servico' ? 'Serviço' : 'Peça'}</small></span>
              <input type="number" min="1" value={i.qtd} aria-label={`Quantidade de ${i.nome}`}
                onChange={(e) => setItens((l) => l.map((x) => (x.id === i.id ? { ...x, qtd: Math.max(1, Number(e.target.value) || 1) } : x)))} />
              <b className="mono">{brl(i.valor * i.qtd)}</b>
              <button type="button" className="d-icon-btn" aria-label={`Remover ${i.nome}`} onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="d-itens__total"><span>Total</span><b className="mono">{brl(totalItens(itens))}</b></div>
    </div>
  )
}

function VeiculoSelect({ value, onChange }) {
  const s = useDemo()
  return (
    <Field label="Veículo">
      {s.veiculos.length === 0 && <p className="d-muted">Cadastre um cliente e um veículo antes de continuar.</p>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {s.veiculos.map((v) => {
          const c = s.clientes.find((x) => x.id === v.clienteId)
          return <option key={v.id} value={v.id}>{v.placa} · {v.modelo} — {c?.nome}</option>
        })}
      </select>
    </Field>
  )
}

export function ModalOS({ veiculoId }) {
  const s = useDemo()
  const [vid, setVid] = useState(veiculoId || s.veiculos[0]?.id || '')
  const [relato, setRelato] = useState('')
  const [mecanico, setMecanico] = useState('Edson')
  const [itens, setItens] = useState([])
  return (
    <FormModal wide title="Nova ordem de serviço" submitLabel="Abrir OS" disabled={!vid}
      onSubmit={() => vid && actions.addOS({ veiculoId: vid, relato, itens, mecanico })}>
      <VeiculoSelect value={vid} onChange={setVid} />
      <Field label="Relato do cliente">
        <textarea rows={2} value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="Ex.: barulho ao passar em lombadas, luz do motor acesa…" />
      </Field>
      <Field label="Mecânico responsável">
        <select value={mecanico} onChange={(e) => setMecanico(e.target.value)}><option>Edson</option><option>Wesley</option></select>
      </Field>
      <ItensEditor itens={itens} setItens={setItens} />
    </FormModal>
  )
}

export function ModalOrcamento() {
  const s = useDemo()
  const [vid, setVid] = useState(s.veiculos[0]?.id ?? '')
  const [obs, setObs] = useState('')
  const [itens, setItens] = useState([])
  return (
    <FormModal wide title="Novo orçamento" submitLabel="Criar orçamento" disabled={itens.length === 0 || !vid}
      onSubmit={() => itens.length && actions.addOrcamento({ veiculoId: vid, itens, obs })}>
      <VeiculoSelect value={vid} onChange={setVid} />
      <Field label="Observações para o cliente"><textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: validade das peças, prazo de execução…" /></Field>
      <ItensEditor itens={itens} setItens={setItens} />
    </FormModal>
  )
}

export function ModalAgenda({ data, hora }) {
  const s = useDemo()
  const [f, setF] = useState({ data: data || iso(1), hora: hora || '09:00', veiculoId: s.veiculos[0]?.id ?? '', servico: '' })
  return (
    <FormModal title="Novo agendamento" submitLabel="Reservar horário" disabled={!f.servico.trim() || !f.veiculoId}
      onSubmit={() => f.servico.trim() && actions.addAgenda({ ...f, servico: f.servico.trim() })}>
      <div className="d-row">
        <Field label="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
        <Field label="Horário">
          <select value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })}>
            {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map((h) => <option key={h}>{h}</option>)}
          </select>
        </Field>
      </div>
      <VeiculoSelect value={f.veiculoId} onChange={(v) => setF({ ...f, veiculoId: v })} />
      <Field label="Serviço"><input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} placeholder="Ex.: Revisão de freios" /></Field>
    </FormModal>
  )
}

export function ModalLancamento() {
  const [f, setF] = useState({ tipo: 'pagar', desc: '', valor: '', venc: iso(7), forma: 'Pix' })
  const valor = Number(String(f.valor).replace(',', '.'))
  const ok = f.desc.trim() && valor > 0
  return (
    <FormModal title="Novo lançamento" submitLabel="Salvar lançamento" disabled={!ok}
      onSubmit={() => ok && actions.addLancamento({ ...f, valor, desc: f.desc.trim() })}>
      <div className="d-seg" role="radiogroup" aria-label="Tipo">
        {[['pagar', 'Conta a pagar'], ['receber', 'Conta a receber']].map(([v, l]) => (
          <button type="button" key={v} role="radio" aria-checked={f.tipo === v} className={f.tipo === v ? 'on' : ''} onClick={() => setF({ ...f, tipo: v })}>{l}</button>
        ))}
      </div>
      <Field label="Descrição"><input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Ex.: Fornecedor de peças — pedido 8850" /></Field>
      <div className="d-row">
        <Field label="Valor (R$)"><input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value.replace(/[^\d,.]/g, '') })} placeholder="0,00" /></Field>
        <Field label="Vencimento"><input type="date" value={f.venc} onChange={(e) => setF({ ...f, venc: e.target.value })} /></Field>
      </div>
      <Field label="Forma de pagamento">
        <select value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })}>{['Pix', 'Dinheiro', 'Cartão', 'Boleto'].map((x) => <option key={x}>{x}</option>)}</select>
      </Field>
    </FormModal>
  )
}

export function Modais() {
  const { modal } = useDemo()
  if (!modal) return null
  switch (modal.tipo) {
    case 'cliente': return <ModalCliente />
    case 'veiculo': return <ModalVeiculo {...modal} />
    case 'os': return <ModalOS {...modal} />
    case 'orcamento': return <ModalOrcamento />
    case 'agenda': return <ModalAgenda {...modal} />
    case 'lancamento': return <ModalLancamento />
    default: return null
  }
}
