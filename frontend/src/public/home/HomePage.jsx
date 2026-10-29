import { Link } from 'react-router-dom'
import { HiArrowRight, HiArrowUpRight, HiCheck, HiHeart, HiOutlineMapPin } from 'react-icons/hi2'
import HeroSlider from '../../components/HeroSlider.jsx'
import SectionHeading from '../../components/SectionHeading.jsx'
import useReveal from '../../hooks/useReveal.js'
import ContactSection from './ContactSection.jsx'
import { COMMITMENTS, HERO_SLIDES, NEWS, PILLARS } from './homeContent.js'
import './home.css'

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

const TICKER = PILLARS.flatMap((pillar) => [pillar.title, ...pillar.items])

export default function HomePage() {
  const ref = useReveal()
  const [latest, ...others] = NEWS

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
              <Link to="/give" className="btn btn--ghost">
                Give to CRO
              </Link>
            </div>
          </div>

          <Link to={`/activities/${latest.slug}`} className="home-hero__latest">
            <img src={latest.image} alt="" />
            <div>
              <span className="home-hero__latest-label">Latest story</span>
              <strong>{latest.title}</strong>
              <time dateTime={latest.date}>{formatDate(latest.date)}</time>
            </div>
            <HiArrowUpRight aria-hidden="true" className="home-hero__latest-arrow" />
          </Link>
        </div>
      </HeroSlider>

      {/* Scrolling ticker of programs (decorative; the same items are listed under CRO Pillars) */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <ul key={copy}>
              {TICKER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>

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
              <a href="#pillars" className="btn btn--purple">
                Explore our pillars <HiArrowRight aria-hidden="true" />
              </a>
              <Link to="/partner-communities" className="about__link">
                Partner with us <HiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CRO Pillars (dark section) */}
      <section id="pillars" className="section pillars" aria-labelledby="pillars-title">
        <div className="container">
          <SectionHeading id="pillars-title" eyebrow="What we focus on" title="CRO Pillars" center light>
            Our outreach is organized around three pillars, each aligned with the UN Sustainable Development Goals.
          </SectionHeading>

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
        </div>
      </section>

      {/* Outreach News */}
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
            {others.slice(0, 5).map((post, i) => (
              <NewsCard key={post.slug} post={post} featured={i === 0} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta__card reveal">
            <div className="cta__copy">
              <span className="eyebrow eyebrow--light">Get involved</span>
              <h2 id="cta-title">Be part of the change</h2>
              <p>Support Centralino-led outreach through donations, volunteering, and community partnerships.</p>
            </div>
            <div className="cta__actions">
              <Link to="/give" className="btn btn--gold">
                Give now <HiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/partner-communities" className="btn btn--ghost">
                Partner with us
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
          <img src={post.image} alt="" loading="lazy" />
          <span className="news-card__tag">{post.tag}</span>
        </div>
        <div className="news-card__body">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <h3>{post.title}</h3>
          <span className="news-card__more">
            Read story <HiArrowRight aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
