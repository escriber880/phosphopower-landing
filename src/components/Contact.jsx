import { useState } from 'react'
import { contact, brand } from '../data/site.js'
import { Arrow } from './Icons.jsx'
import Reveal from './Reveal.jsx'

export default function Contact() {
  /* The site is a static bundle on Render with no server, so the form cannot POST
     anywhere. Rather than fake a receipt — "Request logged" when nothing was sent is
     a lie told to a customer — submit hands the visitor a prefilled mail draft and
     shows exactly what it contains. Swap onSubmit for a fetch() to an endpoint when
     one exists; the .form-ok branch is the only other place that changes. */
  const [draft, setDraft] = useState(null)

  return (
    <section className="section" id="contact" data-num="09" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {contact.kicker}
        </Reveal>

        <div className="contact-grid">
          <Reveal>
            <h2 className="h2">{contact.title}</h2>
            <p className="lead">{contact.sub}</p>

            <ul className="channel-list" data-edit={import.meta.env.DEV ? 'Replace placeholder contact details with live ones' : undefined}>
              {contact.channels.map((c) => (
                <li key={c.label}>
                  {/* not every channel is a link — a postal address must not
                      render as an href-less anchor the whole tree crashes on */}
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      <b>{c.label}</b>
                      <em>{c.value}</em>
                    </a>
                  ) : (
                    <span>
                      <b>{c.label}</b>
                      <em>{c.value}</em>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="form-card glass glass--asym" delay={90} data-edit={import.meta.env.DEV ? 'Point the form at your ESP (Klaviyo/Formspark/SMTP) — see README' : undefined}>
            <h3>{contact.form.title}</h3>
            <p>{contact.form.body}</p>

            {draft ? (
              <div className="form-ok" role="status">
                <b>Ready to send.</b>
                <p>
                  This page has no form endpoint, so nothing has been captured — your request is a draft, not a record. Send it from your own mail
                  app and it reaches the inbox we watch for product, batch and label questions.
                </p>
                <a className="btn btn-primary" href={`mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>
                  Send to {draft.to} <Arrow />
                </a>
                <pre className="form-draft">{draft.body}</pre>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fields = new FormData(e.currentTarget)
                  const body = ['Name', 'Email', 'Request', 'Lot']
                    .map((label) => {
                      const key = { Name: 'name', Email: 'email', Request: 'topic', Lot: 'lot' }[label]
                      const value = String(fields.get(key) || '').trim()
                      return value ? `${label}: ${value}` : null
                    })
                    .filter(Boolean)
                    .join('\n')
                  setDraft({ to: brand.email, subject: 'Documentation pack request', body })
                }}
              >
                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="f-name">Name</label>
                    <input id="f-name" name="name" autoComplete="name" required placeholder="Jordan Avery" />
                  </div>
                  <div className="field">
                    <label htmlFor="f-email">Email</label>
                    <input id="f-email" name="email" type="email" autoComplete="email" required placeholder="you@domain.com" />
                  </div>
                  <div className="field field--full">
                    <label htmlFor="f-topic">What do you need?</label>
                    <select id="f-topic" name="topic" defaultValue={contact.form.interests[0]}>
                      {contact.form.interests.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field field--full">
                    <label htmlFor="f-lot">Lot number (optional)</label>
                    <input id="f-lot" name="lot" placeholder="Printed next to the expiry on the base" />
                  </div>
                </div>

                <label className="consent" htmlFor="f-consent">
                  <input id="f-consent" name="consent" type="checkbox" required />
                  <span>
                    I understand this channel answers product, batch and label questions only — not medical advice, dosing for a condition, or
                    interpretation of lab results.
                  </span>
                </label>

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" data-magnetic>
                    Send request <Arrow />
                  </button>
                  <p className="form-note">
                    No purchase is made on this page. Do not send symptoms, diagnoses or medication lists — that creates a medical-relationship
                    expectation we cannot legally meet.
                  </p>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
