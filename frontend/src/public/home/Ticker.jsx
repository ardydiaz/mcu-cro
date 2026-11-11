import { Link } from 'react-router-dom'
import { HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineSparkles } from 'react-icons/hi2'
import { formatDate } from '../../components/content/contentFormat.js'
import { PILLARS } from './homeContent.js'

const KINDS = {
  upcoming: { label: 'Upcoming', Icon: HiOutlineCalendarDays },
  program: { label: 'Program', Icon: HiOutlineSparkles },
  partner: { label: 'Partner', Icon: HiOutlineMapPin },
}

// What scrolls: upcoming activities, community programs and partner barangays,
// all managed in the admin portal. Falls back to the CRO pillars when empty.
function tickerItems(data) {
  const items = [
    ...(data?.upcoming ?? []).map((p) => ({
      kind: 'upcoming',
      text: `${formatDate(p.eventDate, { month: 'short', day: 'numeric' })} · ${p.title}`,
      to: `/activities/${p.slug}`,
    })),
    ...(data?.ticker?.programs ?? []).map((name) => ({ kind: 'program', text: name, to: '/programs-services' })),
    ...(data?.ticker?.partners ?? []).map((name) => ({ kind: 'partner', text: name, to: '/partner-communities' })),
  ]
  return items.length ? items : PILLARS.flatMap((p) => [p.title, ...p.items]).map((text) => ({ text, to: '/about' }))
}

// Scrolling strip under the hero. Pauses on hover and keyboard focus; the
// second copy (for the seamless loop) is hidden from screen readers.
export default function Ticker({ data }) {
  const items = tickerItems(data)
  // Same reading speed however many items there are.
  const duration = `${Math.max(30, items.length * 5)}s`

  return (
    <nav className="ticker" aria-label="Upcoming activities, programs and partner communities">
      <div className="ticker__track" style={{ animationDuration: duration }}>
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined}>
            {items.map(({ kind, text, to }, i) => {
              const meta = KINDS[kind]
              return (
                <li key={`${kind}-${i}`} className={kind ? `ticker__item--${kind}` : undefined}>
                  <Link to={to} tabIndex={copy === 1 ? -1 : undefined}>
                    {meta && (
                      <span className="ticker__tag">
                        <meta.Icon aria-hidden="true" /> {meta.label}
                      </span>
                    )}
                    {text}
                  </Link>
                </li>
              )
            })}
          </ul>
        ))}
      </div>
    </nav>
  )
}
