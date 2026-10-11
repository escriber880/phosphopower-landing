import { contact } from '../data/site.js'
import Reveal from './Reveal.jsx'

export default function Contact() {
  return (
    <section className="section" id="contact" data-num="09" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {contact.kicker}
        </Reveal>

        {/* No card any more, and no second column of glass to fill: a "Write to us"
            panel whose only action was a mailto repeated the row below it, and a static
            bundle has nothing else to put in that slot. The section is a ledger now —
            what the line is, and the two things worth saying about it. */}
        <div className="contact-top">
          <Reveal>
            <h2 className="h2">{contact.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{contact.sub}</p>
          </Reveal>
        </div>

        <Reveal>
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

          <div className="contact-notes">
            {/* plain text, never an href: the printed address is named so the bottle and
                the page reconcile, not offered as a second inbox */}
            <p className="note-line">
              <b>On the bottle</b>
              {contact.printed}
            </p>
            <p className="note-line">
              <b>Before you write</b>
              {contact.boundary}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
