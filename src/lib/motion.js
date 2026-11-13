import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

// Registro único dos plugins.
gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

export { gsap, ScrollTrigger, ScrollSmoother }
let smoother = null
export const getSmoother = () => smoother

let scrollTween = null

/** Rola até uma âncora com easing suave (ScrollSmoother quando ativo, janela nativa caso contrário). */
export function goTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const offset = 76
  const from = smoother ? smoother.scrollTop() : window.scrollY
  const to = smoother
    ? smoother.offset(el, `top ${offset}px`)
    : Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset)

  scrollTween?.kill()
  if (reduce || Math.abs(to - from) < 2) {
    smoother ? smoother.scrollTop(to) : window.scrollTo(0, to)
  } else {
    const o = { y: from }
    const dist = Math.abs(to - from)
    const stop = () => scrollTween?.kill()
    window.addEventListener('wheel', stop, { once: true, passive: true })
    window.addEventListener('touchstart', stop, { once: true, passive: true })
    scrollTween = gsap.to(o, {
      y: to,
      duration: Math.min(2.2, Math.max(1.1, 0.8 + dist / 2600)),
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => (smoother ? smoother.scrollTop(o.y) : window.scrollTo(0, o.y)),
      onComplete: () => { window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop) },
    })
  }
  el.focus?.({ preventScroll: true })
  history.replaceState(null, '', `#${id}`)
}

export function pauseScroll(paused) {
  if (smoother) smoother.paused(paused)
}

/**
 * Inicializa rolagem suave e animações. Retorna a função de limpeza.
 * - Reduced motion: nada é animado, o conteúdo fica visível e a rolagem é a nativa.
 * - Celular/toque: sem ScrollSmoother (usa rolagem nativa), apenas revelações leves.
 */
export function initMotion(root) {
  const mm = gsap.matchMedia()

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      smooth: '(prefers-reduced-motion: no-preference) and (min-width: 960px) and (hover: hover) and (pointer: fine)',
      small: '(max-width: 959px)',
    },
    (ctx) => {
      const { motion, smooth, small } = ctx.conditions
      if (!motion) return

      if (smooth) {
        smoother = ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 1.15,
          effects: true,
          smoothTouch: false,
          normalizeScroll: false, // mantém a rolagem interna de tabelas, painéis e modais da demonstração
        })
      }

      const q = gsap.utils.selector(root)
      const dy = small ? 18 : 32

      // Entrada do hero: fica pausada até o preloader terminar (evento 'libertymec:intro')
      const intro = gsap.timeline({ paused: true })
      intro
        .from(q('[data-line] > span'), { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.09 }, 0)
        .from(q('[data-hero-fade]'), { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.45)
        .from(q('.hero__car'), { opacity: 0, x: 70, duration: 1.6, ease: 'power3.out' }, 0.2)
        .from('.hdr', { opacity: 0, y: -14, duration: 0.8, ease: 'power3.out' }, 0.3)
      const play = () => intro.play()
      if (window.__introDone) play()
      else window.addEventListener('libertymec:intro', play, { once: true })

      // Revelações em lote
      gsap.set(q('[data-reveal]'), { opacity: 0, y: dy })
      ScrollTrigger.batch(q('[data-reveal]'), {
        start: 'top 90%',
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      })

      // Quadro da demonstração: entra com leve escala
      const frame = q('[data-frame]')[0]
      if (frame) {
        gsap.fromTo(frame, { scale: small ? 0.98 : 0.93, y: small ? 20 : 60, transformOrigin: '50% 0%' }, {
          scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top 96%', end: 'top 40%', scrub: 0.6 },
        })
      }

      // Frase de impacto: palavras acendem conforme a rolagem
      const words = q('[data-words] .w')
      if (words.length) {
        gsap.fromTo(words, { opacity: 0.12, filter: 'blur(7px)' }, {
          opacity: 1, filter: 'blur(0px)', stagger: 0.12, ease: 'none',
          scrollTrigger: { trigger: q('[data-words]')[0], start: 'top 80%', end: 'bottom 55%', scrub: true },
        })
      }

      // Linha do fluxo: preenche conforme se avança
      const line = q('[data-flowline]')[0]
      if (line) {
        gsap.fromTo(line, { scaleY: 0 }, {
          scaleY: 1, ease: 'none', transformOrigin: 'top',
          scrollTrigger: { trigger: q('[data-flow]')[0], start: 'top 60%', end: 'bottom 70%', scrub: 0.4 },
        })
      }
      q('[data-flowstep]').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 68%', toggleClass: { targets: el, className: 'is-on' } })
      })


      requestAnimationFrame(() => ScrollTrigger.refresh())

      return () => { window.removeEventListener('libertymec:intro', play); smoother?.kill(); smoother = null }
    },
  )

  return () => {
    mm.revert()
    smoother?.kill()
    smoother = null
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }
}
