import { useState } from 'react'
import { ArrowRight, Check, Minus, Maximize2, Trash2, Plus, UserPlus, ClipboardPlus, Repeat, Wallet } from 'lucide-react'
import DemoApp, { ThemeToggle } from '../demo/DemoApp'
import { actions } from '../demo/store'
import { goTo } from '../lib/motion'
import { Logo } from './Logo'
import carImg from '../assets/hero-car.jpg'

const NAV = [['recursos', 'Recursos'], ['fluxo', 'Como funciona'], ['planos', 'Planos'], ['duvidas', 'Dúvidas']]

const WHATSAPP = '5514997567621' // DDD 14
const ZAP = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('gostei do site da liberty mec')}`

export function Header() {
  const [open, setOpen] = useState(false)
  const go = (id) => (e) => { e.preventDefault(); setOpen(false); goTo(id) }
  return (
    <header className={`hdr ${open ? 'is-menu' : ''}`}>
      <div className="wrap hdr__in">
        <a href="#topo" className="hdr__logo" aria-label="Liberty Mec — início" onClick={go('topo')}><Logo light /></a>
        <nav className={`hdr__nav ${open ? 'is-open' : ''}`} aria-label="Principal">
          <div className="hdr__links">{NAV.map(([id, l]) => <a key={id} href={`#${id}`} onClick={go(id)}>{l}</a>)}</div>
          <a href="#demo" className="btn btn--white hdr__cta" onClick={go('demo')}>Testar a demonstração</a>
        </nav>
        <button className="hdr__burger" aria-expanded={open} aria-label="Abrir menu" onClick={() => setOpen((o) => !o)}><i /><i /></button>
      </div>
      <div className="announce">
        <span className="tag">7 dias grátis</span>
        <a href="#planos" onClick={go('planos')}>Planos a partir de R$ 70/mês, sem fidelidade <ArrowRight size={14} /></a>
      </div>
    </header>
  )
}

const Lines = ({ children }) => children.map((t, i) => <span className="line" data-line key={i}><span>{t}</span></span>)

const ROTEIRO = [
  { Icon: UserPlus, t: 'Cadastre um cliente', run: () => { actions.ir('clientes'); actions.abrirModal({ tipo: 'cliente' }) } },
  { Icon: ClipboardPlus, t: 'Abra uma ordem de serviço', run: () => { actions.ir('os'); actions.abrirModal({ tipo: 'os' }) } },
  { Icon: Repeat, t: 'Mude o status de uma OS', run: () => { actions.ir('os'); actions.abrirOS('os1') } },
  { Icon: Wallet, t: 'Confira o caixa', run: () => { actions.ir('financeiro') } },
]

export function Hero({ onFull, fullOpen }) {
  return (
    <section className="hero" id="topo" tabIndex={-1}>
      <div className="hero__fx" aria-hidden="true">
        <img className="hero__car" src={carImg} alt="" width="1333" height="2000" decoding="async" fetchPriority="high" />
      </div>
      <div className="hero__dark">
        <div className="wrap hero__center">
          <h1 className="hero__title"><Lines>{['Cada carro no pátio,', 'cada real no caixa.']}</Lines></h1>
          <p className="hero__lead" data-hero-fade>
            O sistema de gestão que organiza ordem de serviço, orçamento, agenda e financeiro da sua oficina, sem planilha e sem perder o histórico do cliente.
          </p>
          <div className="hero__cta" data-hero-fade>
            <a href="#demo" className="btn btn--white" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Testar a demonstração</a>
            <a href="#planos" className="btn btn--ghost" onClick={(e) => { e.preventDefault(); goTo('planos') }}>Ver planos</a>
          </div>
        </div>
      </div>

      <div className="wrap wrap--demo" id="demo" tabIndex={-1}>
        <div className="frame" data-frame>
          <div className="frame__bar">
            <span className="frame__dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="frame__title">Liberty Mec · demonstração interativa</span>
            <ThemeToggle className="frame__theme" />
            <button className="frame__full frame__clear" onClick={() => { if (window.confirm("Apagar todos os dados de exemplo para cadastrar os seus?")) actions.limpar() }} aria-label="Apagar os dados de exemplo para cadastrar os seus"><Trash2 size={14} /><span>Limpar dados</span></button>
            <button className="frame__full" onClick={onFull} aria-label="Abrir demonstração em tela cheia"><Maximize2 size={14} /><span>Tela cheia</span></button>
          </div>
          <div className="frame__screen">{fullOpen ? <div className="frame__placeholder">Demonstração aberta em tela cheia.</div> : <DemoApp />}</div>
        </div>

        <div className="tour" data-reveal>
          <span className="tour__label">Experimente em 1 minuto:</span>
          <ol>
            {ROTEIRO.map(({ Icon, t, run }, i) => (
              <li key={t}><button onClick={run}><span className="tour__n">{i + 1}</span><Icon size={16} />{t}</button></li>
            ))}
          </ol>
        </div>
        <p className="frame__note" data-reveal>
          Dados fictícios, guardados só na memória desta aba. Use “Limpar dados” para apagar os exemplos e cadastrar os seus; ao recarregar a página, tudo volta ao começo.
        </p>
      </div>
    </section>
  )
}

export function Statement() {
  const frase = 'Oficina boa perde dinheiro em três lugares: no orçamento que ninguém cobrou, na peça que não entrou na conta e no cliente que nunca voltou.'
  return (
    <section className="statement">
      <div className="wrap">
        <p className="statement__text" data-words>
          {frase.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}
        </p>
      </div>
    </section>
  )
}

const RECURSOS = [
  { n: '01', t: 'Ordens de serviço', d: 'Do relato do cliente à entrega, cada OS tem etapas, itens, mecânico e previsão. Atrasou? Aparece em vermelho no painel.', g: 'Você sabe o que está parado, onde e por quê.', p: 'Essencial' },
  { n: '02', t: 'Orçamentos que viram OS', d: 'Monte o orçamento com serviços e peças do seu catálogo. Aprovou, vira OS com um clique, sem redigitar nada.', g: 'Menos orçamento esquecido, mais serviço fechado.', p: 'Essencial' },
  { n: '03', t: 'Clientes e veículos por placa', d: 'Busque pela placa e veja tudo: dono, quilometragem, o que já foi feito e quanto custou.', g: 'Atendimento que parece conhecer o carro de cor.', p: 'Essencial' },
  { n: '04', t: 'Agenda do box', d: 'Horários da semana numa grade simples. Clique no horário livre e reserve. Hoje, o painel mostra o que vem aí.', g: 'Box cheio de manhã e sem buraco à tarde.', p: 'Essencial' },
  { n: '05', t: 'Financeiro de verdade', d: 'Contas a receber e a pagar, baixa em um toque e cobrança lançada sozinha quando o carro é entregue.', g: 'Saldo, projeção e vencimentos sem abrir planilha.', p: 'Essencial' },
  { n: '06', t: 'Estoque, comissão e relatórios', d: 'Peças reservadas na OS, alerta de estoque mínimo, comissão por mecânico e lucro por serviço e por mês.', g: 'Descobre quanto sobra de cada serviço, não só quanto entra.', p: 'Completo' },
]

export function Recursos() {
  return (
    <section className="sec sec--ledger" id="recursos" tabIndex={-1}>
      <div className="wrap">
        <header className="sec__head" data-reveal>
          <p className="eyebrow">O que tem dentro</p>
          <h2>Feito para a rotina do balcão e do box.</h2>
        </header>
        <ol className="ledger">
          {RECURSOS.map((r) => (
            <li key={r.n} data-reveal>
              <span className="ledger__n mono">{r.n}</span>
              <h3>{r.t}</h3>
              <p>{r.d}</p>
              <p className="ledger__gain"><b>Pra você:</b> {r.g}</p>
              <span className={`tag tag--${r.p === 'Completo' ? 'amber' : 'ink'}`}>{r.p}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const FLUXO = [
  ['Recepção', 'O cliente chega, você busca a placa. Se já é da casa, o histórico aparece. Se não, cadastra em 20 segundos.'],
  ['Orçamento', 'Serviços e peças saem do seu catálogo, com valor certo. O cliente aprova e o orçamento vira ordem de serviço.'],
  ['Execução', 'O mecânico, a previsão e as etapas ficam na OS. Quem entra no escritório vê o pátio inteiro de relance.'],
  ['Entrega', 'Marcou como entregue, a cobrança já nasce no financeiro. Ninguém precisa lembrar de lançar.'],
  ['Recebimento', 'Dê baixa no Pix, no cartão ou no boleto e acompanhe o saldo e o que ainda vai entrar.'],
]

export function Fluxo() {
  return (
    <section className="sec sec--flow" id="fluxo" tabIndex={-1}>
      <div className="wrap flow" data-flow>
        <header className="flow__head" data-reveal>
          <p className="eyebrow">Como funciona</p>
          <h2>Um fluxo só, da porta da oficina ao pagamento.</h2>
          <p>Cada etapa alimenta a próxima. Você digita uma vez e o sistema leva a informação até o caixa.</p>
          <a href="#demo" className="btn btn--white" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Fazer isso na demonstração <ArrowRight size={18} /></a>
        </header>
        <ol className="flow__steps">
          <span className="flow__rail" aria-hidden="true"><span data-flowline /></span>
          {FLUXO.map(([t, d], i) => (
            <li key={t} data-flowstep>
              <span className="flow__dot mono">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const ANTES = ['Ordem de serviço no caderno e foto no WhatsApp', 'Orçamento refeito do zero quando o cliente aprova', 'Peça comprada e esquecida na conta do cliente', 'Fim do mês sem saber quanto realmente sobrou']
const DEPOIS = ['OS na tela, com etapa, mecânico e previsão', 'Aprovou, virou OS. Um clique, zero redigitação', 'Tudo que entrou no carro está na conta, item por item', 'Saldo, vencimentos e projeção sempre à vista']

export function AntesDepois() {
  return (
    <section className="sec sec--compare">
      <div className="wrap compare">
        <div className="compare__col" data-reveal>
          <h3>Hoje, em muita oficina</h3>
          <ul>{ANTES.map((t) => <li key={t}><Minus size={16} aria-hidden="true" />{t}</li>)}</ul>
        </div>
        <div className="compare__col compare__col--new" data-reveal>
          <h3>Com o Liberty Mec</h3>
          <ul>{DEPOIS.map((t) => <li key={t}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{t}</li>)}</ul>
        </div>
      </div>
    </section>
  )
}

const TABELA = [
  ['Rotina da oficina', [
    ['Clientes e veículos com histórico por placa', true, true],
    ['Ordens de serviço ilimitadas', true, true],
    ['Orçamentos que viram OS', true, true],
    ['Agenda do box', true, true],
    ['Link de acompanhamento para o cliente', false, true],
  ]],
  ['Dinheiro e controle', [
    ['Contas a pagar e a receber', true, true],
    ['Cobrança lançada na entrega da OS', true, true],
    ['Estoque de peças com reserva e alerta de mínimo', false, true],
    ['Comissão por mecânico', false, true],
    ['Relatórios de lucro por OS, serviço e mês', false, true],
    ['Garantias e retornos controlados', false, true],
  ]],
  ['Equipe e suporte', [
    ['Usuários incluídos', 'até 3', 'até 10'],
    ['Suporte', 'por e-mail', 'prioritário no WhatsApp'],
  ]],
]

const Cell = ({ v }) => v === true ? <Check size={18} strokeWidth={2.6} aria-label="Incluído" /> : v === false ? <Minus size={16} aria-label="Não incluído" className="x" /> : <span>{v}</span>

export function Planos() {
  return (
    <section className="sec sec--plans" id="planos" tabIndex={-1}>
      <div className="wrap">
        <header className="sec__head" data-reveal>
          <p className="eyebrow">Planos</p>
          <h2>Dois planos. Sem taxa de adesão, sem fidelidade.</h2>
          <p className="sec__sub">Comece pelo Essencial e passe para o Completo quando a oficina pedir estoque, comissão e relatórios. Teste grátis por 7 dias.</p>
        </header>

        <div className="plans" data-reveal role="table" aria-label="Comparação de planos">
          <div className="plans__head" role="row">
            <div role="columnheader" className="plans__h0"><span>Compare e escolha</span></div>
            <div role="columnheader" className="plans__h">
              <h3>Essencial</h3>
              <p className="price"><b>R$ 70</b><span>/mês</span></p>
              <p className="plans__for">Para organizar a casa: OS, orçamento, agenda e caixa.</p>
              <a href="#demo" className="btn btn--ghost" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Testar agora</a>
            </div>
            <div role="columnheader" className="plans__h plans__h--pro">
              <span className="plans__flag">Mais escolhido</span>
              <h3>Completo</h3>
              <p className="price"><b>R$ 90</b><span>/mês</span></p>
              <p className="plans__for">Para quem quer saber quanto lucra: estoque, comissão e relatórios.</p>
              <a href="#demo" className="btn btn--white" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Testar agora</a>
            </div>
          </div>
          {TABELA.map(([grupo, linhas]) => (
            <div role="rowgroup" key={grupo}>
              <div className="plans__group" role="row"><span role="cell">{grupo}</span><span className="plans__colname" role="columnheader">Essencial</span><span className="plans__colname" role="columnheader">Completo</span></div>
              {linhas.map(([nome, a, b]) => (
                <div className="plans__row" role="row" key={nome}>
                  <div role="rowheader">{nome}</div>
                  <div role="cell"><Cell v={a} /></div>
                  <div role="cell" className="is-pro"><Cell v={b} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  ['Preciso instalar alguma coisa?', 'Não. O Liberty Mec abre no navegador do computador, do tablet ou do celular. O mecânico consulta a OS no pátio, o dono acompanha de casa.'],
  ['Posso trocar de plano depois?', 'Pode, quando quiser. Subiu do Essencial para o Completo, o novo valor vale a partir do próximo ciclo. Sem multa para descer também.'],
  ['Tem fidelidade ou taxa de adesão?', 'Nenhuma das duas. Você paga mensalmente e cancela quando quiser, sem ligar para ninguém.'],
  ['Consigo trazer meus clientes e veículos de uma planilha?', 'Sim. Na implantação, importamos sua lista de clientes e veículos para você não começar do zero.'],
  ['A demonstração salva o que eu digito?', 'Não. Tudo fica só na memória da aba. Ao recarregar a página, os dados voltam ao exemplo original. Nada é enviado nem guardado.'],
  ['Meus dados ficam seguros?', 'Cada oficina tem seus dados separados, com acesso por usuário e perfil (dono, atendente, mecânico) e backup diário.'],
]

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="sec" id="duvidas" tabIndex={-1}>
      <div className="wrap faq">
        <header className="faq__head" data-reveal>
          <p className="eyebrow">Dúvidas frequentes</p>
          <h2>O que todo dono de oficina pergunta.</h2>
        </header>
        <ul className="faq__list">
          {FAQ.map(([q, a], i) => (
            <li key={q} data-reveal className={open === i ? 'is-open' : ''}>
              <h3><button aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faq-b-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                {q}<Plus size={20} aria-hidden="true" />
              </button></h3>
              <div id={`faq-${i}`} role="region" aria-labelledby={`faq-b-${i}`} className="faq__a"><div><p>{a}</p></div></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Final() {
  return (
    <section className="final">
      <div className="wrap final__in">
        <h2 data-reveal>Veja a sua oficina funcionando antes de assinar.</h2>
        <div data-reveal className="final__cta">
          <a href="#demo" className="btn btn--white" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Testar a demonstração</a>
          <p>7 dias grátis · sem cartão · cancele quando quiser</p>
        </div>
      </div>
      <footer className="ft">
        <div className="wrap">
          <div className="ft__top">
            <div className="ft__brand">
              <Logo light />
              <p>Gestão para oficina mecânica: ordem de serviço, orçamento, agenda e financeiro num só lugar.</p>
            </div>
            <nav className="ft__col" aria-label="Produto">
              <h3>Produto</h3>
              <ul>{NAV.map(([id, l]) => <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); goTo(id) }}>{l}</a></li>)}</ul>
            </nav>
            <nav className="ft__col" aria-label="Começar">
              <h3>Começar</h3>
              <ul>
                <li><a href="#demo" onClick={(e) => { e.preventDefault(); goTo('demo') }}>Testar a demonstração</a></li>
                <li><a href="#planos" onClick={(e) => { e.preventDefault(); goTo('planos') }}>Ver planos</a></li>
                <li><a href="#duvidas" onClick={(e) => { e.preventDefault(); goTo('duvidas') }}>7 dias grátis, sem cartão</a></li>
              </ul>
            </nav>
            <div className="ft__col ft__col--contact">
              <h3>Contato</h3>
              <p className="ft__hint">Quer um site assim ou quer falar comigo? Clique em “Feito por Rizzo Web” e me mande uma mensagem no WhatsApp.</p>
              <a className="foot__credit" href={ZAP} target="_blank" rel="noopener noreferrer" aria-label="Feito por Rizzo Web: abrir conversa no WhatsApp"><svg className="foot__sym" viewBox="0 0 256 256" width="18" height="18" aria-hidden="true"><path d="M42 48H190L65 120H190L65 192H134" fill="none" stroke="currentColor" strokeWidth="34" strokeLinejoin="miter" strokeMiterlimit="2" /><circle cx="192" cy="192" r="28" fill="#E39A0B" /></svg><span className="foot__label">Feito por <strong>Rizzo Web</strong></span><ArrowRight size={14} className="foot__arrow" /></a>
            </div>
          </div>
          <div className="ft__bottom">
            <span>© {new Date().getFullYear()} Liberty Mec</span>
            <small>Produto fictício de demonstração. Dados e nomes na demonstração são inventados.</small>
            <span className="ft__status"><i aria-hidden="true" />Demonstração online</span>
          </div>
        </div>
      </footer>
    </section>
  )
}
