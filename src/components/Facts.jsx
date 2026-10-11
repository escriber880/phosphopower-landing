import { facts } from '../data/site.js'
import { percentDailyValue } from '../lib/ld.js'
import Reveal from './Reveal.jsx'

export default function Facts() {
  return (
    <section className="section section--paper" id="facts" data-num="04" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {facts.kicker}
        </Reveal>

        <div className="facts-grid">
          <Reveal className="facts-col">
            <h2 className="h2">{facts.title}</h2>

            <ul className="facts-meta" data-edit={import.meta.env.DEV ? 'Fill from the carton of the batch you are shipping' : undefined}>
              <li>Lot — printed on base</li>
              <li>60 capsules</li>
              <li>30 servings</li>
              <li>COA per batch</li>
            </ul>

            <div className="facts-panel" data-edit={import.meta.env.DEV ? 'Mirrors the printed artwork verbatim (facts.rows[].dvPrinted) — re-check after any label revision' : undefined}>
              <p className="facts-title">Supplement Facts</p>
              <div className="facts-hair" />
              <div className="facts-sub">
                <span>Serving Size: {facts.servingSize}</span>
                <span>Servings Per Container: {facts.servingsPerContainer}</span>
              </div>
              <div className="facts-hair facts-hair--thin" />

              <div className="facts-thead">
                <span>Amount per serving</span>
                <span />
                <span>% Daily Value</span>
              </div>

              {facts.rows.map((row, i) => {
                // a row may print the %DV from the artwork verbatim (dvPrinted) and may
                // declare an amount in mcg while the DV ratio needs mg (dvAmount).
                // 0% is a real value, not “no DV” — so every test below is a null test.
                const pct = row.dvKey
                  ? (row.dvPrinted ?? percentDailyValue(row.dvKey, row.dvAmount ?? row.amount))
                  : null
                return (
                  <div className="facts-row" key={row.nutrient}>
                    <span>
                      <b>{row.nutrient}</b>
                      <i>{row.detail}</i>
                    </span>
                    <span className="facts-amt">
                      {row.amount.toLocaleString('en-US')} {row.unit}
                    </span>
                    <span className="facts-pct">{pct === null ? '†' : `${pct}%`}</span>
                    {/* coverage gauge for the reference intake — only where a DV exists */}
                    {/* 0% still has a Daily Value, so it draws an empty real track —
                        the dashed track is reserved for nutrients with no DV at all */}
                    {pct !== null ? (
                      <span className="dv-bar" aria-hidden="true">
                        <i style={{ '--w': `${Math.min(100, pct)}%`, '--d': `${320 + i * 110}ms` }} />
                      </span>
                    ) : (
                      <span className="dv-bar dv-bar--none" aria-hidden="true" />
                    )}
                  </div>
                )
              })}

              <div className="facts-hair facts-hair--thin" style={{ marginTop: '0.5rem' }} />
              <p className="facts-foot">{facts.footnote}</p>
              <p className="facts-other">
                <b>Other Ingredients:</b> {facts.other}
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="paper-card">
              <h3>{facts.use.title}</h3>
              <p>{facts.use.body}</p>
            </div>
            <div className="paper-card">
              <h3>{facts.handling.title}</h3>
              <p>{facts.handling.body}</p>
              {facts.handling.caution && <p className="facts-foot">{facts.handling.caution}</p>}
            </div>
            <div className="paper-card">
              <h3>{facts.missing.title}</h3>
              <ul className="paper-list">
                {facts.missing.items.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
