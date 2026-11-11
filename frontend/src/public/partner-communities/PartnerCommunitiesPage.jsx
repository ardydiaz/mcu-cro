import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineMapPin } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { EmptyState } from '../../components/content/ContentCards.jsx'
import { paragraphs } from '../../components/content/contentFormat.js'
import { listPartners } from '../../api/public.api.js'
import { SERVICE_TYPE_LABELS } from '../../constants/services.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

// Requirements §7 Partner Communities: information about partner barangays, the
// community programs implemented there and the services available. Only
// totals are shown — never information about individual beneficiaries.
export default function PartnerCommunitiesPage() {
  const { data: partners, error, loading } = useApi(listPartners, [])

  return (
    <>
      <PageHero eyebrow="Working together" title="Partner Communities">
        The barangays MCU works with, the programs implemented with them, and the services brought to their residents.
      </PageHero>

      <div className="container section">
        {loading && <p className="loading-note">Loading…</p>}
        {error && <p className="loading-note">We couldn't load the partner communities. Please try again later.</p>}
        {partners?.length === 0 && <EmptyState icon={HiOutlineMapPin} title="Partner communities will be listed here soon" />}
        {partners?.length > 0 && (
          <ul className="partner-grid">
            {partners.map((b) => (
              <li key={b.id} className="partner-card">
                <header>
                  <span className="partner-card__icon">
                    <HiOutlineMapPin aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{b.name}</h2>
                    <span>{b.city}</span>
                  </div>
                </header>
                {paragraphs(b.description).map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {b.programs.length > 0 && (
                  <div className="partner-card__group">
                    <h3>Programs implemented</h3>
                    <ul className="chip-list">
                      {b.programs.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {b.serviceTypes.length > 0 && (
                  <div className="partner-card__group">
                    <h3>Services available</h3>
                    <ul className="chip-list chip-list--light">
                      {b.serviceTypes.map((t) => (
                        <li key={t}>{SERVICE_TYPE_LABELS[t] ?? t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(b.servicesRendered > 0 || b.colleges.length > 0) && (
                  <p className="partner-card__stats">
                    {b.servicesRendered > 0 && `${b.servicesRendered.toLocaleString()} services rendered`}
                    {b.colleges.length > 0 && ` · with ${b.colleges.join(', ')}`}
                  </p>
                )}
                {b.activities > 0 && (
                  <Link to="/activities" className="partner-card__link">
                    {b.activities} {b.activities === 1 ? 'activity' : 'activities'} <HiArrowRight aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="cta-strip">
          <div>
            <h2>Want MCU to partner with your community?</h2>
            <p>Barangays, schools and organizations can coordinate with the Community Relations Office.</p>
          </div>
          <Link to="/contact?topic=partnership" className="btn btn--gold">
            Coordinate with CRO <HiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  )
}
