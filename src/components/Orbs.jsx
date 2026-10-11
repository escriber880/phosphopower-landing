/** Three blurred gradient lights at different scroll speeds — the depth layer. */
export default function Orbs({ variant = 'a' }) {
  const sets = {
    a: [
      { cls: 'orb orb--gold', speed: '0.16', style: { top: '6%', right: '6%', width: '34vw', height: '34vw' } },
      { cls: 'orb orb--cyan', speed: '0.30', style: { bottom: '4%', left: '2%', width: '26vw', height: '26vw' } },
      { cls: 'orb orb--blue', speed: '0.08', style: { top: '38%', left: '44%', width: '40vw', height: '30vw' } },
    ],
    b: [
      { cls: 'orb orb--cyan', speed: '0.22', style: { top: '10%', left: '8%', width: '22vw', height: '22vw' } },
      { cls: 'orb orb--gold', speed: '0.12', style: { bottom: '8%', right: '4%', width: '28vw', height: '22vw' } },
    ],
  }
  return (
    <div className="orbs" aria-hidden="true">
      {(sets[variant] || sets.a).map((o) => (
        <span key={o.cls} className={o.cls} data-parallax={o.speed} style={o.style} />
      ))}
    </div>
  )
}
