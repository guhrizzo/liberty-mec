export function Logo({ light = false, compact = false }) {
  const fg = light ? '#F4F0E8' : '#14120F'
  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, color: fg }}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="8.5" fill="none" stroke={fg} strokeWidth="3.2" />
        <circle cx="23" cy="9" r="3.6" fill="#E39A0B" />
      </svg>
      {!compact && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, letterSpacing: '-0.035em' }}>Liberty Mec</span>}
      {compact && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.035em' }}>Liberty Mec</span>}
    </span>
  )
}
