import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import carImg from '../assets/hero-car.jpg'

const MIN_MS = 1700 // tempo mínimo para a animação respirar
const MAX_MS = 5000 // nunca prende o visitante: segue mesmo se algo demorar

// Pré-carrega de verdade: fontes, foto do hero e o evento load da página.
function whenReady() {
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const photo = new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = carImg })
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((res) => window.addEventListener('load', res, { once: true }))
  const min = new Promise((res) => setTimeout(res, MIN_MS))
  const max = new Promise((res) => setTimeout(res, MAX_MS))
  return Promise.race([Promise.all([fonts, photo, loaded, min]), max])
}

export default function Preloader({ onDone }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    const html = document.documentElement
    html.style.overflow = 'hidden'
    let dead = false

    const ctx = gsap.context(() => {
      const count = el.querySelector('.pre__count')
      const bar = el.querySelector('.pre__bar i')
      const c = { v: 0 }
      const render = () => {
        count.textContent = String(Math.round(c.v)).padStart(2, '0')
        bar.style.transform = `scaleX(${c.v / 100})`
      }

      // Entrada: o anel se desenha, o pino faz uma volta de biela, a palavra sobe
      gsap.timeline()
        .fromTo('.pre__ring', { strokeDashoffset: 107 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
        .fromTo('.pre__orbit', { rotation: -405, svgOrigin: '32 32' }, { rotation: -45, svgOrigin: '32 32', duration: 1.4, ease: 'power3.inOut' }, 0)
        .fromTo('.pre__word span', { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.5)
        .fromTo('.pre__foot', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.3)

      // Progresso "otimista" até 88%, até a página realmente ficar pronta
      gsap.to(c, { v: 88, duration: 1.9, ease: 'power1.out', onUpdate: render })

      const exit = () => {
        gsap.timeline({ onComplete: () => { if (!dead) onDone() } })
          .to('.pre__center, .pre__foot', { opacity: 0, y: -14, duration: 0.4, ease: 'power2.in' })
          .add(() => { window.__introDone = true; window.dispatchEvent(new Event('libertymec:intro')) }, 0.45)
          .to(el, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, 0.35)
      }

      whenReady().then(() => {
        if (dead) return
        gsap.to(c, { v: 100, duration: 0.45, ease: 'power2.out', overwrite: true, onUpdate: render, onComplete: exit })
      })
    }, el)

    return () => { dead = true; ctx.revert(); html.style.overflow = '' }
  }, [onDone])

  return (
    <div className="pre" ref={root} role="status" aria-live="polite" aria-label="Carregando o Liberty Mec">
      <div className="pre__center">
        <svg className="pre__mark" viewBox="0 0 64 64" aria-hidden="true">
          <circle className="pre__ring" cx="32" cy="32" r="17" fill="none" stroke="#EDF2F5" strokeWidth="6" strokeDasharray="107" strokeLinecap="round" transform="rotate(-90 32 32)" />
          <g className="pre__orbit"><circle cx="46" cy="32" r="7" fill="#E39A0B" /></g>
        </svg>
        <div className="pre__word" aria-hidden="true"><span>Liberty Mec</span></div>
      </div>
      <div className="pre__foot">
        <span className="pre__count mono" aria-hidden="true">00</span>
        <span className="pre__bar" aria-hidden="true"><i /></span>
        <span className="pre__tag">Gestão para oficina mecânica</span>
      </div>
    </div>
  )
}
