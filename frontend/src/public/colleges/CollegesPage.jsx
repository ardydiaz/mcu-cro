import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineBuildingLibrary } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { listColleges } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

// Requirements §3 Colleges/Departments: the 11 units that provide services and
// their own learning materials (Step 3 – content owners).
export default function CollegesPage() {
  const { data: colleges, error, loading } = useApi(listColleges, [])

  return (
    <>
      <PageHero eyebrow="Our colleges and departments" title="Colleges & Departments">
        Each MCU college and department brings its own expertise and learning materials to our partner communities.
      </PageHero>
      <div className="container section">
        {loading && <p className="loading-note">Loading…</p>}
        {error && <p className="loading-note">We couldn't load the colleges. Please try again later.</p>}
        {colleges && (
          <ul className="college-grid">
            {colleges.map((c) => (
              <li key={c.id}>
                <Link to={`/colleges/${c.slug}`} className="college-card">
                  <span className="college-card__code">{c.code}</span>
                  <h2>{c.name}</h2>
                  <p>{c.description ?? (c.servicesOffered.length ? c.servicesOffered.slice(0, 3).join(' · ') : 'Programs, services and learning materials for our partner communities.')}</p>
                  <span className="college-card__more">
                    {c.resourceCount > 0 ? `${c.resourceCount} learning ${c.resourceCount === 1 ? 'material' : 'materials'}` : 'View college'}
                    <HiArrowRight aria-hidden="true" />
                  </span>
                  <HiOutlineBuildingLibrary className="college-card__icon" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
