/* Self-contained icon set — no icon font, no CDN, currentColor everywhere. */

const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function Mark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 6l22 13v26L32 58 10 45V19z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".55" />
      <circle cx="32" cy="32" r="5" fill="var(--gold)" />
      <ellipse cx="32" cy="32" rx="15" ry="7.5" transform="rotate(28 32 32)" fill="none" stroke="var(--blue-lt)" strokeWidth="1.5" />
      <ellipse cx="32" cy="32" rx="15" ry="7.5" transform="rotate(-28 32 32)" fill="none" stroke="var(--blue)" strokeWidth="1.5" />
    </svg>
  )
}

export function Arrow({ dir = 'right' }) {
  const d = dir === 'down' ? 'M12 5v14M6 13l6 6 6-6' : 'M4 12h15M13 6l6 6-6 6'
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function Menu() {
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function Shield() {
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function Bolt() {
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <path d="M13 2L5 13h6l-1 9 8-11h-6z" />
    </svg>
  )
}

export function Leaf() {
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <path d="M4 20c0-8 6-14 16-15 0 10-5 15-13 15" />
      <path d="M4 20c4-4 7-6 11-8" />
    </svg>
  )
}

export function Info() {
  return (
    <svg viewBox="0 0 24 24" {...s} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

export function Verified() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 1.7 2.9-.2 1 2.8 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.8-2.9-.2L12 22l-2.4-1.7-2.9.2-1-2.8L3.3 16l1-2.8-1-2.8 2.4-1.7 1-2.8 2.9.2zm-1.2 13.4l5-5-1.3-1.3-3.7 3.7-1.8-1.8-1.3 1.3z" />
    </svg>
  )
}

export function Star({ filled = true }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3">
      <path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" />
    </svg>
  )
}

export function Facebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.2-1.5 1.5-1.5h1.6V4.3c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.1H8v3h2.2V21h3.3z" />
    </svg>
  )
}

export function Xmark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.3 3h3.1l-6.8 7.7L21.7 21h-6l-4.3-5.5L6.3 21H3.2l7.2-8.2L2.7 3h6.1l3.9 5.1L16.6 3zm-1 16h1.7L7.3 4.8H5.5L16.3 19z" />
    </svg>
  )
}

export function Instagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.9" r="1.15" fill="currentColor" />
    </svg>
  )
}

export function TikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.3 3c.3 2.1 1.5 3.5 3.5 3.7v2.7c-1.3.1-2.5-.3-3.7-1.1v5.5c0 4.7-5.2 6.2-8.2 3.4-1.9-1.8-1.8-5 .2-6.7 1-.9 2.4-1.3 3.8-1.2v2.9c-.4-.1-.8-.1-1.2 0-1.3.3-1.9 1.6-1.4 2.8.5 1.3 2 1.7 3.2 1.1.7-.4 1-1.1 1-2V3h2.8z" />
    </svg>
  )
}

/* Lookup wrappers — keep this module exporting components only so Fast Refresh works. */

const socialMap = { facebook: Facebook, x: Xmark, instagram: Instagram, tiktok: TikTok }
const audMap = { shield: Shield, bolt: Bolt, leaf: Leaf }

export function SocialIcon({ name }) {
  const Cmp = socialMap[name] || Info
  return <Cmp />
}

export function AudIcon({ name }) {
  const Cmp = audMap[name] || Shield
  return <Cmp />
}
