import { contact, brand } from '../data/site.js'
import { Arrow } from './Icons.jsx'
import Reveal from './Reveal.jsx'

export default function Contact() {
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

          <Reveal className="ask-card glass glass--asym" delay={90}>
            <h3>{contact.write.title}</h3>
            <p>{contact.write.body}</p>

            {/* A plain mailto, not a form: a static bundle has nowhere to POST, and a
                "Request logged" panel would describe a record that does not exist. */}
            <a className="btn btn-primary" href={`mailto:${brand.email}`}>
              {contact.write.cta} <Arrow />
            </a>
            <p className="ask-note">{contact.write.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
