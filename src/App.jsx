import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { initMotion, pauseScroll, ScrollTrigger } from './lib/motion'
import Preloader from './landing/Preloader'
import { Header, Hero, Statement, Recursos, Fluxo, AntesDepois, Planos, Faq, Final } from './landing/Landing'
import DemoApp, { ThemeToggle } from './demo/DemoApp'
import './landing/landing.css'

const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Com movimento reduzido não há preloader: o conteúdo aparece direto
if (reduceMotion) window.__introDone = true

export default function App() {
  const root = useRef(null)
  const [pre, setPre] = useState(!reduceMotion)
  const donePre = useCallback(() => { setPre(false); requestAnimationFrame(() => ScrollTrigger.refresh()) }, [])
  const [full, setFull] = useState(false)

  // Registro, inicialização e limpeza de GSAP / ScrollTrigger / ScrollSmoother
  useLayoutEffect(() => initMotion(root.current), [])

  const close = useCallback(() => setFull(false), [])
  useEffect(() => {
    if (!full) return
    pauseScroll(true)
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      pauseScroll(false)
    }
  }, [full, close])

  return (
    <>
      {pre && <Preloader onDone={donePre} />}
      <a className="skip" href="#demo">Ir para a demonstração</a>
      <Header />
      <div id="smooth-wrapper" ref={root}>
        <div id="smooth-content">
          <main>
            <Hero onFull={() => setFull(true)} fullOpen={full} />
            <div className="rails">
            <Statement />
            <Recursos />
            <Fluxo />
            <AntesDepois />
            <Planos />
            <Faq />
            </div>
          </main>
          <Final />
        </div>
      </div>
      {full && createPortal(
        <div className="fullscreen" role="dialog" aria-modal="true" aria-label="Demonstração em tela cheia">
          <div className="fullscreen__tools"><ThemeToggle className="frame__theme" /><button className="fullscreen__close" onClick={close} autoFocus><X size={16} /> Sair da tela cheia</button></div>
          <DemoApp fullscreen onClose={close} />
        </div>, document.body)}
    </>
  )
}
