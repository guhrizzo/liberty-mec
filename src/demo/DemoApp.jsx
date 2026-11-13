import { LayoutDashboard, Users, CarFront, ClipboardList, FileText, CalendarDays, Wallet, RotateCcw, Moon, Sun, Trash2, ArrowLeft, LogOut } from 'lucide-react'
import { useDemo, actions } from './store'
import { Modais } from './modals'
import { useSession, sair } from '../app/session'
import { Painel, PainelReal, Clientes, Veiculos, Ordens, Orcamentos, Agenda, Financeiro } from './views'
import { Logo } from '../landing/Logo'
import './demo.css'

export const ROTAS = [
  { id: 'painel', label: 'Painel', Icon: LayoutDashboard, View: Painel },
  { id: 'os', label: 'Ordens', Icon: ClipboardList, View: Ordens },
  { id: 'orcamentos', label: 'Orçamentos', Icon: FileText, View: Orcamentos },
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays, View: Agenda },
  { id: 'clientes', label: 'Clientes', Icon: Users, View: Clientes },
  { id: 'veiculos', label: 'Veículos', Icon: CarFront, View: Veiculos },
  { id: 'financeiro', label: 'Financeiro', Icon: Wallet, View: Financeiro },
]

// Modo real: só o núcleo da oficina (agenda e financeiro entram na próxima etapa).
export const ROTAS_REAL = [
  { id: 'painel', label: 'Painel', Icon: LayoutDashboard, View: PainelReal },
  { id: 'os', label: 'Ordens', Icon: ClipboardList, View: Ordens },
  { id: 'orcamentos', label: 'Orçamentos', Icon: FileText, View: Orcamentos },
  { id: 'clientes', label: 'Clientes', Icon: Users, View: Clientes },
  { id: 'veiculos', label: 'Veículos', Icon: CarFront, View: Veiculos },
]

const textoPlano = (o) => {
  if (!o) return ''
  const ate = o.trialAte && new Date(o.trialAte + 'T23:59:59')
  if (ate && ate >= new Date()) return `Teste grátis até ${o.trialAte.slice(8, 10)}/${o.trialAte.slice(5, 7)}`
  return `Plano ${o.plano === 'completo' ? 'Completo' : 'Essencial'}`
}

/** Botão de alternar tema claro/escuro da demonstração (usado no quadro, na tela cheia e no menu). */
export function ThemeToggle({ className = '', label = true }) {
  const { tema } = useDemo()
  const escuro = tema === 'escuro'
  return (
    <button className={`theme-toggle ${className}`} onClick={actions.alternarTema} aria-pressed={escuro}
      aria-label={escuro ? 'Mudar a demonstração para o modo claro' : 'Mudar a demonstração para o modo escuro'}>
      {escuro ? <Sun size={14} /> : <Moon size={14} />}{label && <span>{escuro ? 'Modo claro' : 'Modo escuro'}</span>}
    </button>
  )
}

// O app inteiro é um container (container-type) para reagir à largura do quadro, não da janela.
export default function DemoApp({ fullscreen = false, onClose }) {
  const s = useDemo()
  const { oficina } = useSession()
  const real = s.modo === 'real'
  const rotas = real ? ROTAS_REAL : ROTAS
  const atual = rotas.find((r) => r.id === s.rota) ?? rotas[0]
  const View = atual.View
  const limpar = () => { if (window.confirm('Apagar todos os dados de exemplo para cadastrar os seus?')) actions.limpar() }
  return (
    <div className={`demo ${fullscreen ? 'demo--full' : ''}`} data-theme={s.tema === 'escuro' ? 'dark' : 'light'}>
      <div className="demo__app">
        <nav className="d-side" aria-label="Seções do sistema">
          <div className="d-side__brand"><Logo light compact /></div>
          <ul>
            {rotas.map(({ id, label, Icon }) => (
              <li key={id}>
                <button className={s.rota === id ? 'on' : ''} aria-label={label} aria-current={s.rota === id ? 'page' : undefined} onClick={() => actions.ir(id)}>
                  <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
          {real ? (
            <div className="d-side__foot">
              <div className="d-side__shop"><b>{oficina?.nome}</b><small>{textoPlano(oficina)}</small></div>
              <ThemeToggle className="d-side__theme" />
              <button className="d-side__reset" onClick={sair} title="Sair da conta"><LogOut size={14} /><span>Sair</span></button>
            </div>
          ) : (
            <div className="d-side__foot">
              {fullscreen && onClose && <button className="d-side__exit" onClick={onClose}><ArrowLeft size={15} /><span>Voltar para a página</span></button>}
              <div className="d-side__shop"><b>Auto Center Ribeiro</b><small>Plano Completo · demonstração</small></div>
              <ThemeToggle className="d-side__theme" />
              <button className="d-side__clear" onClick={limpar} title="Apagar os dados de exemplo para cadastrar os seus"><Trash2 size={14} /><span>Limpar dados</span></button>
              <button className="d-side__reset" onClick={actions.restaurar} title="Restaurar dados de exemplo"><RotateCcw size={14} /><span>Restaurar dados</span></button>
            </div>
          )}
        </nav>
        <main className="d-main" id="demo-main" tabIndex={-1} key={s.rota}>
          <View />
        </main>
        <Modais />
        {s.toast && <div className="d-toast" role="status">{s.toast}</div>}
      </div>
    </div>
  )
}
