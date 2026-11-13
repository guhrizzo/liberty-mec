import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { statusOf } from './data'

export function Plate({ value }) {
  return <span className="plate" aria-label={`Placa ${value}`}>{value}</span>
}

export function StatusBadge({ id }) {
  const s = statusOf(id)
  return <span className={`badge badge--${s.tone}`}>{s.label}</span>
}

export function Badge({ tone = 'grey', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const first = ref.current?.querySelector('input, select, textarea, button')
    first?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const f = [...ref.current.querySelectorAll('input, select, textarea, button:not([disabled])')]
        if (!f.length) return
        const a = f[0], z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); prev?.focus?.({ preventScroll: true }) }
  }, [onClose])
  return (
    <div className="d-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`d-modal ${wide ? 'd-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="d-modal__head">
          <h3>{title}</h3>
          <button className="d-icon-btn" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="d-modal__body">{children}</div>
        {footer && <footer className="d-modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="d-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Empty({ children }) {
  return <div className="d-empty">{children}</div>
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="d-pagehead">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      <div className="d-pagehead__actions">{children}</div>
    </div>
  )
}
