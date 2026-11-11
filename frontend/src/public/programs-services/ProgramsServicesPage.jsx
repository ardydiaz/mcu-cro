import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineSparkles } from 'react-icons/hi2'
import { PiFirstAidKit, PiTooth, PiEye, PiPersonSimpleWalk, PiChalkboardTeacher, PiHandHeart } from 'react-icons/pi'
import PageHero from '../../components/PageHero.jsx'
import SectionHeading from '../../components/SectionHeading.jsx'
import { listColleges, listPrograms } from '../../api/public.api.js'
import { SERVICE_AREAS } from '../../constants/content.js'
import useApi from '../../hooks/useApi.js'
import useReveal from '../../hooks/useReveal.js'
import '../public-pages.css'

const ICONS = {
  medical: PiFirstAidKit,
  dental: PiTooth,
  optical: PiEye,
  physical_therapy: PiPersonSimpleWalk,
  health_education: PiChalkboardTeacher,
  other: PiHandHeart,
}

// Requirements §4 Programs and Services: Medical, Dental, Optical, Physical
// Therapy, Health Education and other college/department services, plus the
// community programs they are delivered through.
export default function ProgramsServicesPage() {
  const programs = useApi(listPrograms, [])
  const colleges = useApi(listColleges, [])
  const collegeByCode = Object.fromEntries((colleges.data ?? []).map((c) => [c.code, c]))
  const ref = useReveal([Boolean(programs.data)])

  return (
    <div ref={ref}>
      <PageHero eyebrow="What we offer" title="Programs & Services">
        Services offered by MCU colleges and departments during community activities, and the programs that bring them to
        our partner communities.
      </PageHero>

      <section className="container section" aria-labelledby="services-title">
        <SectionHeading id="services-title" eyebrow="Services" title="Services offered">
          Provided by faculty and students under supervision, during outreach activities and medical missions.
        </SectionHeading>
        <ul className="service-grid">
          {SERVICE_AREAS.map(({ key, title, text, colleges: codes }) => {
            const Icon = ICONS[key]
            return (
              <li key={key} className="service-card">
                <span className="service-card__icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="service-card__colleges">
                  {codes.map((code) =>
                    collegeByCode[code] ? (
                      <Link key={code} to={`/colleges/${collegeByCode[code].slug}`} title={collegeByCode[code].name}>
                        {code}
                      </Link>
                    ) : (
                      <span key={code}>{code}</span>
                    ),
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="section section--tinted" aria-labelledby="programs-title">
        <div className="container">
          <SectionHeading id="programs-title" eyebrow="Programs" title="Community programs" />
          {programs.loading && <p className="loading-note">Loading…</p>}
          {programs.data?.length === 0 && <p className="loading-note">Programs will be listed here soon.</p>}
          {programs.data?.length > 0 && (
            <ul className="program-list">
              {programs.data.map((p) => (
                <li key={p.id} className={p.isFeatured ? 'is-featured' : undefined}>
                  <div>
                    <h3>
                      {p.isFeatured && <HiOutlineSparkles aria-label="Featured program" />} {p.name}
                    </h3>
                    {p.description && <p>{p.description}</p>}
                  </div>
                  <dl>
                    {p.colleges.length > 0 && (
                      <div>
                        <dt>Colleges involved</dt>
                        <dd>{p.colleges.join(', ')}</dd>
                      </div>
                    )}
                    {p.barangaysReached > 0 && (
                      <div>
                        <dt>Barangays reached</dt>
                        <dd>{p.barangaysReached}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          )}
          <p className="section-cta">
            <Link to="/contact?topic=service_request" className="btn btn--purple">
              Request a service for your community <HiArrowRight aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
