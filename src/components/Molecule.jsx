const ATOMS = [
  { id: 'N', x: 70, y: 215, label: 'NH₂', part: 'head' },
  { id: 'C1', x: 165, y: 160, label: 'CH₂', part: 'head' },
  { id: 'C2', x: 260, y: 215, label: 'CH₂', part: 'head' },
  { id: 'O3', x: 355, y: 160, label: 'O', part: 'link' },
  { id: 'P', x: 450, y: 215, label: 'P', part: 'link' },
  { id: 'Oa', x: 450, y: 95, label: 'O', part: 'link' },
  { id: 'Ob', x: 528, y: 150, label: 'O⁻', part: 'link' },
  { id: 'Oc', x: 528, y: 282, label: 'O⁻', part: 'link' },
  { id: 'Ca', x: 398, y: 296, label: 'Ca²⁺', part: 'metal', big: true },
]

const BONDS = [
  { a: 'N', b: 'C1', part: 'head' },
  { a: 'C1', b: 'C2', part: 'head' },
  { a: 'C2', b: 'O3', part: 'link' },
  { a: 'O3', b: 'P', part: 'link' },
  { a: 'P', b: 'Oa', part: 'link', double: true },
  { a: 'P', b: 'Ob', part: 'link' },
  { a: 'P', b: 'Oc', part: 'link' },
  { a: 'Ca', b: 'Ob', part: 'metal', ionic: true },
  { a: 'Ca', b: 'Oc', part: 'metal', ionic: true },
]

const at = (id) => ATOMS.find((a) => a.id === id)

/**
 * Skeletal schematic of calcium 2-aminoethylphosphate. Schematic on purpose:
 * it is a labelling diagram, not a geometry-accurate render (bonds are drawn
 * at fixed lengths, the ionic bridge is flattened). `active` highlights one of
 * three named regions; `--draw` (from scroll) makes the bonds ink themselves.
 */
export default function Molecule({ active = '' }) {
  return (
    <svg className="mol" viewBox="0 0 560 340" role="img" aria-label="Schematic of the calcium 2-aminoethylphosphate molecule: an ethanolamine head, a phosphate group, and a calcium ion bridging two oxygens.">
      <g className="mol-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx="300" cy="200" r={54 + i * 46} />
        ))}
      </g>

      {BONDS.map((b) => {
        const A = at(b.a)
        const B = at(b.b)
        return (
          <g key={`${b.a}-${b.b}`} className="mol-bond" data-part={b.part} data-dim={active && active !== b.part ? '1' : undefined}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} pathLength="1" className={b.ionic ? 'is-ionic' : ''} />
            {b.double && <line x1={A.x + 9} y1={A.y} x2={B.x + 9} y2={B.y} pathLength="1" />}
          </g>
        )
      })}

      {ATOMS.map((a) => (
        <g
          key={a.id}
          className={`mol-atom${a.big ? ' is-metal' : ''}`}
          data-part={a.part}
          data-dim={active && active !== a.part ? '1' : undefined}
          style={{ '--i': ATOMS.indexOf(a) }}
        >
          <circle cx={a.x} cy={a.y} r={a.big ? 27 : 22} />
          <text x={a.x} y={a.y + 1}>
            {a.label}
          </text>
        </g>
      ))}

      <g className="mol-tags" aria-hidden="true">
        {[
          { part: 'head', x: 150, y: 288, label: 'ethanolamine' },
          { part: 'link', x: 486, y: 44, label: 'phosphate' },
          { part: 'metal', x: 296, y: 334, label: 'calcium bridge' },
        ].map((t) => (
          <text key={t.part} x={t.x} y={t.y} className="mol-tag" data-part={t.part} data-on={active === t.part ? '1' : undefined}>
            {t.label}
          </text>
        ))}
      </g>
    </svg>
  )
}
