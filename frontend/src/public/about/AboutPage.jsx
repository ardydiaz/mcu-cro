import { Link } from 'react-router-dom'
import {
  HiArrowRight,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineLink,
  HiOutlineMapPin,
} from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import SectionHeading from '../../components/SectionHeading.jsx'
import { getHome, listPartners } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import useReveal from '../../hooks/useReveal.js'
import PillarCards from '../home/PillarCards.jsx'
import { COMMITMENTS } from '../home/homeContent.js'
import '../home/home.css'
import '../public-pages.css'

// Requirements §2 About Community Relations: role of the CRO, community
// engagement initiatives, partnered communities.
const ROLE = [
  { Icon: HiOutlineLink, title: 'Connect', text: 'Links MCU colleges and departments with partner barangays and organizations.' },
  { Icon: HiOutlineCalendarDays, title: 'Coordinate', text: 'Plans and runs outreach, medical missions and other community activities.' },
  { Icon: HiOutlineClipboardDocumentList, title: 'Follow up', text: 'Keeps records of beneficiaries and their services, for follow-up and program planning.' },
  { Icon: HiOutlineBookOpen, title: 'Share', text: 'Brings learning materials prepared by MCU colleges to partner communities.' },
]

const GALLERY = [
  { src: '/images/news/welcome-event.jpg', alt: 'Welcome event for MCU students', slug: 'welcome-event-mcu-students' },
  { src: '/images/news/lifeline-2026.jpg', alt: 'Lifeline 2026 blood donation drive', slug: 'lifeline-2026-blood-donation' },
  { src: '/images/news/malusog-na-atay.jpg', alt: 'Malusog na Atay, Masayang Buhay health activity', slug: 'malusog-na-atay-masayang-buhay' },
  { src: '/images/news/memorandum-signing.jpg', alt: 'Partnership memorandum signing', slug: 'memorandum-signing' },
  { src: '/images/news/pusong-masigla.jpg', alt: 'Pusong Masigla, Ngiting Masaya outreach', slug: 'pusong-masigla-ngiting-masaya' },
]

export default function AboutPage() {
  const home = useApi(getHome, [])
  const partners = useApi(listPartners, [])
  const ref = useReveal([Boolean(home.data), Boolean(partners.data)])
  const impact = home.data?.impact

  return (
    <div ref={ref}>
      <PageHero eyebrow="Manila Central University" title="About Community Relations">
        The Community Relations Office (CRO) leads MCU's engagement with its partner communities.
      </PageHero>

      {/* Who we are */}
      <section className="section about-intro" aria-labelledby="who-title">
        <div className="container about-intro__grid">
          <div className="about-intro__media reveal">
            <img src="/images/slides/slide-1.jpg" alt="MCU volunteers with community members at an outreach event" className="about-intro__photo" />
            <img
              src="/images/news/medical-mission.jpg"
              alt="MCU medical mission in a partner community"
              className="about-intro__photo about-intro__photo--small"
              loading="lazy"
            />
            {impact?.beneficiaries > 0 && (
              <div className="about-intro__stat">
                <strong>{impact.beneficiaries.toLocaleString()}</strong>
                <span>community members served</span>
              </div>
            )}
          </div>

          <div>
            <span className="eyebrow reveal">Who we are</span>
            <h2 id="who-title" className="about-intro__title reveal">
              Bridging MCU and the <mark>communities</mark> we serve.
            </h2>
            <p className="about-intro__lead reveal">
              The Community Relations Office brings the knowledge and skills of MCU's colleges and departments to partner
              barangays, through education, environment, and health &amp; wellness programs.
            </p>
            <ul className="about-values">
              {COMMITMENTS.map(({ Icon, title, text }, i) => (
                <li key={title} className="reveal" style={{ '--reveal-delay': `${i * 90}ms` }}>
                  <span className="about-values__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Reach in numbers (totals only) */}
      {impact?.services > 0 && (
        <section className="impact" aria-label="Our reach">
          <dl className="container impact__grid">
            {[
              ['Beneficiaries served', impact.beneficiaries],
              ['Services rendered', impact.services],
              ['Partner barangays', impact.barangays],
              ['Colleges & departments involved', impact.colleges],
            ].map(([label, value]) => (
              <div key={label} className="reveal">
                <dd>{value.toLocaleString()}</dd>
                <dt>{label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Role of the CRO */}
      <section className="section" aria-labelledby="role-title">
        <div className="container">
          <SectionHeading id="role-title" eyebrow="Our role" title="What the Community Relations Office does" center>
            From the first coordination meeting to the follow-up visit, CRO keeps MCU's community work organized and
            accountable.
          </SectionHeading>
          <ol className="role-steps">
            {ROLE.map(({ Icon, title, text }, i) => (
              <li key={title} className="reveal" style={{ '--reveal-delay': `${i * 100}ms` }}>
                <span className="role-steps__num" aria-hidden="true">
                  0{i + 1}
                </span>
                <span className="role-steps__icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Community engagement initiatives */}
      <section className="section pillars" aria-labelledby="initiatives-title">
        <div className="container">
          <SectionHeading id="initiatives-title" eyebrow="Community engagement initiatives" title="Our pillars" center light>
            Our outreach is organized around three pillars, each aligned with the UN Sustainable Development Goals.
          </SectionHeading>
          <PillarCards />
        </div>
      </section>

      {/* Partnered communities */}
      <section className="section" aria-labelledby="partners-title">
        <div className="container">
          <div className="news__header">
            <SectionHeading id="partners-title" eyebrow="Partnered communities" title="Where we work">
              Barangays that partner with MCU for regular programs and services.
            </SectionHeading>
            <Link to="/partner-communities" className="btn btn--outline reveal">
              About our partners <HiArrowRight aria-hidden="true" />
            </Link>
          </div>
          {partners.data?.length > 0 ? (
            <ul className="about-places">
              {partners.data.map((b, i) => (
                <li key={b.id} className="reveal" style={{ '--reveal-delay': `${(i % 3) * 80}ms` }}>
                  <span className="about-places__pin">
                    <HiOutlineMapPin aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{b.name}</h3>
                    <p>{b.city}</p>
                    {(b.servicesRendered > 0 || b.programs.length > 0) && (
                      <p className="about-places__stats">
                        {[
                          b.programs.length > 0 && `${b.programs.length} program${b.programs.length === 1 ? '' : 's'}`,
                          b.servicesRendered > 0 && `${b.servicesRendered.toLocaleString()} services`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !partners.loading && <p className="loading-note">Our partner communities will be listed here soon.</p>
          )}
        </div>
      </section>

      {/* Photo strip from past activities */}
      <section className="about-gallery" aria-label="Moments from our activities">
        <ul className="container about-gallery__grid">
          {GALLERY.map((photo, i) => (
            <li key={photo.slug} className="reveal" style={{ '--reveal-delay': `${i * 70}ms` }}>
              <Link to={`/activities/${photo.slug}`}>
                <img src={photo.src} alt={photo.alt} loading="lazy" />
                <span>{photo.alt}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Call to action */}
      <section className="cta" aria-labelledby="about-cta-title">
        <div className="container">
          <div className="cta__card reveal">
            <div className="cta__copy">
              <span className="eyebrow eyebrow--light">Partner with us</span>
              <h2 id="about-cta-title">Let's build healthier communities together</h2>
              <p>Barangays, schools and organizations can coordinate programs and services with the Community Relations Office.</p>
            </div>
            <div className="cta__actions">
              <Link to="/contact?topic=partnership" className="btn btn--gold">
                Coordinate with CRO <HiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/activities" className="btn btn--ghost">
                See our activities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
