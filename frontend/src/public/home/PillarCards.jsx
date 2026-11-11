import { HiCheck } from 'react-icons/hi2'
import { PILLARS } from './homeContent.js'
import './home.css'

// The three CRO pillars with their programs and SDGs (dark cards, used on Home and About).
export default function PillarCards() {
  return (
    <div className="pillars__grid">
      {PILLARS.map(({ key, Icon, title, items, sdgs }, i) => (
        <article key={key} className={`pillar pillar--${key} reveal`} style={{ '--reveal-delay': `${i * 120}ms` }}>
          <div className="pillar__top">
            <span className="pillar__icon">
              <Icon aria-hidden="true" />
            </span>
            <span className="pillar__number" aria-hidden="true">
              0{i + 1}
            </span>
          </div>
          <h3>{title}</h3>
          <ul className="pillar__items">
            {items.map((item) => (
              <li key={item}>
                <HiCheck aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="pillar__sdgs">
            <span>Supports SDGs</span>
            <ul>
              {sdgs.map(({ n, name, src }) => (
                <li key={n}>
                  <img src={src} alt={`SDG ${n}: ${name}`} title={`SDG ${n}: ${name}`} width="52" height="52" loading="lazy" />
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  )
}
