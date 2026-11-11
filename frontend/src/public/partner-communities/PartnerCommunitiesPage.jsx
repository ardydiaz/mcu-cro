import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiArrowRight,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { PiChalkboardTeacher, PiEye, PiFirstAidKit, PiHandHeart, PiPersonSimpleWalk, PiPill, PiStethoscope, PiTestTube, PiTooth } from 'react-icons/pi'
import { EmptyState } from '../../components/content/ContentCards.jsx'
import { paragraphs } from '../../components/content/contentFormat.js'
import { listPartners } from '../../api/public.api.js'
import { SERVICE_TYPE_LABELS } from '../../constants/services.js'
import useApi from '../../hooks/useApi.js'
import '../../components/page-hero.css'
import '../home/home.css'
import '../public-pages.css'

const SERVICE_ICONS = {
  medical: PiStethoscope,
  dental: PiTooth,
  optical: PiEye,
  physical_therapy: PiPersonSimpleWalk,
  nursing: PiFirstAidKit,
  laboratory: PiTestTube,
  pharmacy: PiPill,
  health_education: PiChalkboardTeacher,
  other: PiHandHeart,
}

const STEPS = [
  { Icon: HiOutlineChatBubbleLeftRight, title: 'Coordinate', text: 'The barangay and CRO agree on the community’s needs and schedule.' },
  { Icon: HiOutlineSparkles, title: 'Plan programs', text: 'MCU colleges prepare programs, services and health learning materials.' },
  { Icon: HiOutlineHeart, title: 'Serve', text: 'Students and faculty bring medical, dental, optical and other services.' },
  { Icon: HiOutlineClipboardDocumentCheck, title: 'Follow up', text: 'Services are recorded so residents get follow-up care and referrals.' },
]

// "Barangay 176 Bagong Silang" → "176"; otherwise the initials.
const monogram = (name) =>
  name.match(/\d+/)?.[0] ??
  name
    .replace(/^(barangay|brgy\.?)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

// The name without the leading "Barangay 176" part, e.g. "Bagong Silang".
const placeName = (name) => name.replace(/^(barangay|brgy\.?)\s*\d*\s*/i, '').trim()

// Requirements §7 Partner Communities: information about partner barangays, the
// community programs implemented there and the services available. Only
// totals are shown — never information about individual beneficiaries.
export default function PartnerCommunitiesPage() {
  const { data: partners, error, loading } = useApi(listPartners, [])
  const [search, setSearch] = useState('')

  const list = partners ?? []
  const totals = {
    barangays: list.length,
    programs: new Set(list.flatMap((b) => b.programs)).size,
    services: list.reduce((sum, b) => sum + b.servicesRendered, 0),
    activities: list.reduce((sum, b) => sum + b.activities, 0),
  }
  const term = search.trim().toLowerCase()
  const shown = term ? list.filter((b) => `${b.name} ${b.city}`.toLowerCase().includes(term)) : list

  return (
    <>
      <section className="page-hero pc-hero">
        <div className="container pc-hero__inner">
          <div>
            <span className="page-hero__eyebrow">Working together</span>
            <h1>Partner Communities</h1>
            <p>The barangays MCU works with, the programs implemented with them, and the services brought to their residents.</p>
          </div>
          {list.length > 0 && (
            <dl className="pc-stats">
              <div>
                <dt>Partner barangays</dt>
                <dd>{totals.barangays}</dd>
              </div>
              <div>
                <dt>Community programs</dt>
                <dd>{totals.programs}</dd>
              </div>
              <div>
                <dt>Services rendered</dt>
                <dd>{totals.services.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Activities</dt>
                <dd>{totals.activities}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* How a partnership works */}
      <section className="pc-steps-wrap" aria-label="How a partnership works">
        <ol className="container pc-steps">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title}>
              <span className="pc-steps__icon">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h2>
                  <span aria-hidden="true">0{i + 1}</span> {title}
                </h2>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="container section pc-body">
        <div className="pc-head">
          <div>
            <span className="eyebrow">Where we work</span>
            <h2 className="pc-head__title">Our partner barangays</h2>
          </div>
          {list.length > 6 && (
            <label className="pc-search">
              <HiOutlineMagnifyingGlass aria-hidden="true" />
              <span className="visually-hidden">Search barangays</span>
              <input type="search" placeholder="Search a barangay…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          )}
        </div>

        {loading && (
          <div className="pc-grid" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="resource-skeleton" />
            ))}
          </div>
        )}
        {error && <p className="loading-note">We couldn't load the partner communities. Please try again later.</p>}
        {partners?.length === 0 && <EmptyState icon={HiOutlineMapPin} title="Partner communities will be listed here soon" />}
        {list.length > 0 && shown.length === 0 && <EmptyState icon={HiOutlineMagnifyingGlass} title={`No barangay matches “${search}”`} />}

        {shown.length > 0 && (
          <ul className="pc-grid">
            {shown.map((b) => (
              <PartnerCard key={b.id} barangay={b} />
            ))}
          </ul>
        )}
      </div>

      <section className="cta" aria-labelledby="pc-cta-title">
        <div className="container">
          <div className="cta__card">
            <div className="cta__copy">
              <span className="eyebrow eyebrow--light">Become a partner</span>
              <h2 id="pc-cta-title">Want MCU to partner with your community?</h2>
              <p>Barangays, schools and organizations can coordinate programs and services with the Community Relations Office.</p>
            </div>
            <div className="cta__actions">
              <Link to="/contact?topic=partnership" className="btn btn--gold">
                Coordinate with CRO <HiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/programs-services" className="btn btn--ghost">
                Programs & services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function PartnerCard({ barangay: b }) {
  const place = placeName(b.name)
  const isNew = b.servicesRendered === 0 && b.programs.length === 0 && b.activities === 0
  const description = paragraphs(b.description)

  return (
    <li className="pc-card">
      <header className="pc-card__head">
        <span className="pc-card__mark" aria-hidden="true">
          <small>Brgy.</small>
          {monogram(b.name)}
        </span>
        <div>
          <h3>{place || b.name}</h3>
          <p>
            <HiOutlineMapPin aria-hidden="true" /> {place ? `${b.name.replace(place, '').trim()}, ` : ''}
            {b.city}
          </p>
        </div>
      </header>

      {description.length > 0 && <p className="pc-card__text">{description[0]}</p>}

      {!isNew && (
      <dl className="pc-card__stats">
        <div>
          <dt>
            <HiOutlineSparkles aria-hidden="true" /> Programs
          </dt>
          <dd>{b.programs.length}</dd>
        </div>
        <div>
          <dt>
            <HiOutlineUserGroup aria-hidden="true" /> Services
          </dt>
          <dd>{b.servicesRendered.toLocaleString()}</dd>
        </div>
        <div>
          <dt>
            <HiOutlineCalendarDays aria-hidden="true" /> Activities
          </dt>
          <dd>{b.activities}</dd>
        </div>
      </dl>
      )}

      {b.serviceTypes.length > 0 && (
        <div className="pc-card__group">
          <h4>Services available</h4>
          <ul className="pc-services">
            {b.serviceTypes.map((t) => {
              const Icon = SERVICE_ICONS[t] ?? PiHandHeart
              return (
                <li key={t}>
                  <Icon aria-hidden="true" /> {SERVICE_TYPE_LABELS[t] ?? t}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {b.programs.length > 0 && (
        <div className="pc-card__group">
          <h4>Programs implemented</h4>
          <ul className="pc-programs">
            {b.programs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="pc-card__foot">
        {isNew ? (
          <span className="pc-card__new">New partner · programs coming soon</span>
        ) : b.colleges.length > 0 ? (
          <span className="pc-card__colleges">
            With{' '}
            {b.colleges.map((c) => (
              <abbr key={c}>{c}</abbr>
            ))}
          </span>
        ) : (
          <span />
        )}
        {b.activities > 0 && (
          <Link to="/activities" className="pc-card__link">
            Activities <HiArrowRight aria-hidden="true" />
          </Link>
        )}
      </footer>
    </li>
  )
}
