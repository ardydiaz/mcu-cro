import { Link } from 'react-router-dom'
import { HiArrowRight, HiHeart, HiOutlineMapPin, HiOutlineMegaphone, HiOutlineSparkles } from 'react-icons/hi2'
import HeroSlider from '../../components/HeroSlider.jsx'
import SectionHeading from '../../components/SectionHeading.jsx'
import { ResourceCard } from '../../components/content/ContentCards.jsx'
import { formatDate } from '../../components/content/contentFormat.js'
import { getHome } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import useReveal from '../../hooks/useReveal.js'
import ContactSection from './ContactSection.jsx'
import HighlightSlider from './HighlightSlider.jsx'
import PillarCards from './PillarCards.jsx'
import Ticker from './Ticker.jsx'
import { COMMITMENTS, HERO_SLIDES } from './homeContent.js'
import './home.css'

// Requirements §1 Home: introduction to MCU Community Relations, featured
// community programs, announcements, and featured learning materials
// ("Alaga Ko Barangay Ko: Alaga sa Bawat Edad").
export default function HomePage() {
  const { data } = useApi(getHome, [])
  const ref = useReveal([Boolean(data)])
  const stories = data?.recent ?? []
  // Hero slider: every upcoming activity first, then recent stories (up to 8 slides).
  const highlights = [
    ...(data?.upcoming ?? []).map((post) => ({ post, label: 'Upcoming activity' })),
    ...stories.map((post) => ({ post, label: 'Latest story' })),
  ].slice(0, 8)

  return (
    <div ref={ref}>
      <HeroSlider slides={HERO_SLIDES} label="Community Relations Office highlights">
        <div className="home-hero">
          <div className="home-hero__copy">
            <span className="home-hero__eyebrow">Manila Central University</span>
            <h1>
              Community <span>Relations</span> Office
            </h1>
            <p>We commit to use our resources to make a positive impact in communities.</p>
            <div className="home-hero__actions">
              <a href="#pillars" className="btn btn--gold">
                Explore our pillars <HiArrowRight aria-hidden="true" />
              </a>
              <Link to="/learning-resources" className="btn btn--ghost">
                Learning resources
              </Link>
            </div>
          </div>

          <HighlightSlider items={highlights} />
        </div>
      </HeroSlider>

      {/* Scrolling ticker: upcoming activities, programs and partner barangays */}
      <Ticker data={data} />

      {/* Announcements */}
      {data?.announcements.length > 0 && (
        <section className="announcements" aria-labelledby="announcements-title">
          <div className="container announcements__inner">
            <h2 id="announcements-title">
              <HiOutlineMegaphone aria-hidden="true" /> Announcements
            </h2>
            <ul>
              {data.announcements.map((a) => (
                <li key={a.id}>
                  <Link to={`/activities/${a.slug}`}>
                    <time dateTime={a.eventDate}>{formatDate(a.eventDate, { month: 'short', day: 'numeric' })}</time>
                    <span>{a.title}</span>
                    <HiArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/activities?tab=announcements" className="announcements__all">
              All announcements
            </Link>
          </div>
        </section>
      )}

      {/* Who we are */}
      <section className="section about" aria-labelledby="about-title">
        <div className="container about__grid">
          <div className="about__media reveal">
            <img
              className="about__photo"
              src="/images/slides/slide-1.jpg"
              alt="MCU volunteers with community members at an outreach event"
              loading="lazy"
            />
            <img
              className="about__photo about__photo--small"
              src="/images/slides/slide-2.jpg"
              alt="MCU nursing students with community partners at the university auditorium"
              loading="lazy"
            />
            <span className="about__place">
              <HiOutlineMapPin aria-hidden="true" /> EDSA, Caloocan City
            </span>
            <RotatingBadge />
          </div>

          <div className="about__copy">
            <span className="eyebrow reveal">Who we are</span>
            <h2 id="about-title" className="reveal">
              Serving communities, empowering <mark>Centralinos</mark>.
            </h2>
            <p className="about__intro reveal">
              The Community Relations Office connects Manila Central University with partner communities through
              education, environment, and health &amp; wellness programs.
            </p>

            <ol className="about__list">
              {COMMITMENTS.map(({ Icon, title, text }, i) => (
                <li key={title} className="reveal" style={{ '--reveal-delay': `${i * 90}ms` }}>
                  <span className="about__num">0{i + 1}</span>
                  <span className="about__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="about__actions reveal">
              <Link to="/about" className="btn btn--purple">
                About Community Relations <HiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/partner-communities" className="about__link">
                Our partner communities <HiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Impact in numbers (totals only) */}
      {data?.impact.services > 0 && (
        <section className="impact" aria-label="Our reach">
          <dl className="container impact__grid">
            {[
              ['Beneficiaries served', data.impact.beneficiaries],
              ['Services rendered', data.impact.services],
              ['Partner barangays', data.impact.barangays],
              ['Colleges & departments involved', data.impact.colleges],
            ].map(([label, value]) => (
              <div key={label} className="reveal">
                <dd>{value.toLocaleString()}</dd>
                <dt>{label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* CRO Pillars (dark section) */}
      <section id="pillars" className="section pillars" aria-labelledby="pillars-title">
        <div className="container">
          <SectionHeading id="pillars-title" eyebrow="What we focus on" title="CRO Pillars" center light>
            Our outreach is organized around three pillars, each aligned with the UN Sustainable Development Goals.
          </SectionHeading>

          <PillarCards />
        </div>
      </section>

      {/* Featured community programs */}
      {data?.featuredPrograms.length > 0 && (
        <section className="section featured-programs" aria-labelledby="programs-title">
          <div className="container">
            <div className="news__header">
              <SectionHeading id="programs-title" eyebrow="Featured community programs" title="Programs in our communities" />
              <Link to="/programs-services" className="btn btn--outline reveal">
                Programs & services <HiArrowRight aria-hidden="true" />
              </Link>
            </div>
            <ul className="featured-programs__grid">
              {data.featuredPrograms.map((p, i) => (
                <li key={p.id} className="reveal" style={{ '--reveal-delay': `${i * 80}ms` }}>
                  <HiOutlineSparkles aria-hidden="true" />
                  <h3>{p.name}</h3>
                  {p.description && <p>{p.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Featured learning materials */}
      <section className="section featured-materials" aria-labelledby="materials-title">
        <div className="container">
          <div className="news__header">
            <SectionHeading id="materials-title" eyebrow="Featured learning materials" title="Alaga Ko Barangay Ko: Alaga sa Bawat Edad">
              Health videos, modules and materials from MCU colleges, for every age.
            </SectionHeading>
            <Link to="/learning-resources" className="btn btn--outline reveal">
              All learning resources <HiArrowRight aria-hidden="true" />
            </Link>
          </div>
          {data?.featuredResources.length > 0 ? (
            <div className="resource-grid">
              {data.featuredResources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <p className="featured-materials__soon reveal">
              Learning materials from MCU colleges and departments are being prepared. Please check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Outreach News: the latest published activities */}
      {stories.length > 0 && (
        <section className="section news" aria-labelledby="news-title">
          <div className="container">
            <div className="news__header">
              <SectionHeading id="news-title" eyebrow="Latest stories" title="Outreach News">
                Highlights from our recent activities with partner communities.
              </SectionHeading>
              <Link to="/activities" className="btn btn--outline reveal">
                View all activities <HiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="news__grid">
              {stories.slice(0, 6).map((post, i) => (
                <NewsCard key={post.id} post={post} featured={i === 0} delay={i * 80} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to action */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta__card reveal">
            <div className="cta__copy">
              <span className="eyebrow eyebrow--light">Work with us</span>
              <h2 id="cta-title">Bring MCU's programs to your community</h2>
              <p>Barangays, schools and organizations can coordinate outreach activities and services with the Community Relations Office.</p>
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

      <ContactSection />
    </div>
  )
}

// Circular text badge that slowly rotates (decorative).
function RotatingBadge() {
  return (
    <span className="about__badge" aria-hidden="true">
      <svg className="about__badge-ring" viewBox="0 0 120 120">
        <defs>
          <path id="about-badge-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <text>
          <textPath href="#about-badge-circle" textLength="276">
            Manila Central University • Community Relations •
          </textPath>
        </text>
      </svg>
      <HiHeart className="about__badge-icon" />
    </span>
  )
}

function NewsCard({ post, featured = false, delay = 0 }) {
  return (
    <article className={`news-card reveal${featured ? ' news-card--featured' : ''}`} style={{ '--reveal-delay': `${delay}ms` }}>
      <Link to={`/activities/${post.slug}`} className="news-card__link">
        <div className="news-card__media">
          {post.coverUrl && <img src={post.coverUrl} alt="" loading="lazy" />}
          <span className="news-card__tag">{post.program?.name ?? 'Outreach'}</span>
        </div>
        <div className="news-card__body">
          <time dateTime={post.eventDate}>{formatDate(post.eventDate)}</time>
          <h3>{post.title}</h3>
          <span className="news-card__more">
            Read story <HiArrowRight aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
