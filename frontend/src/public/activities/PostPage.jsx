import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  HiArrowLeft,
  HiArrowRight,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineBuildingLibrary,
  HiOutlineCalendarDays,
  HiOutlineCheck,
  HiOutlineLink,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiXMark,
} from 'react-icons/hi2'
import { FaFacebookF } from 'react-icons/fa6'
import { EmptyState, PostCard } from '../../components/content/ContentCards.jsx'
import { formatDate, paragraphs } from '../../components/content/contentFormat.js'
import { getPost, listPosts } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

const TODAY = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10) // Philippines
const DAY = 86400000

// "Today", "In 5 days", "3 weeks ago"… relative to today in the Philippines.
function relativeDay(iso) {
  const days = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / DAY)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  const abs = Math.abs(days)
  const amount = abs < 14 ? `${abs} days` : abs < 60 ? `${Math.round(abs / 7)} weeks` : abs < 730 ? `${Math.round(abs / 30)} months` : `${Math.round(abs / 365)} years`
  return days > 0 ? `In ${amount}` : `${amount} ago`
}

function statusOf(p) {
  if (p.kind === 'announcement') return { key: 'announcement', label: 'Announcement' }
  return p.eventDate >= TODAY ? { key: 'upcoming', label: 'Upcoming activity' } : { key: 'past', label: 'Past activity' }
}

// One activity (with its photo documentation) or announcement.
export default function PostPage() {
  const { slug } = useParams()
  const { data: p, error, loading } = useApi(() => getPost(slug), [slug])
  const related = useApi(() => listPosts({ kind: 'activity', pageSize: 4 }), [])
  const [viewing, setViewing] = useState(null) // index of the photo shown large

  if (loading) return <p className="container section loading-note event-loading">Loading…</p>
  if (error) {
    return (
      <div className="container section event-loading">
        <EmptyState title="This page is not available">
          <Link to="/activities">See all community activities</Link>.
        </EmptyState>
      </div>
    )
  }

  const photos = p.photos ?? []
  const show = (i) => setViewing((i + photos.length) % photos.length)
  const status = statusOf(p)
  const isAnnouncement = p.kind === 'announcement'
  const where = [p.location, p.barangay?.name].filter(Boolean).join(', ')
  const body = paragraphs(p.body)
  const others = (related.data?.items ?? []).filter((item) => item.slug !== p.slug).slice(0, 3)
  const date = new Date(`${p.eventDate}T00:00:00`)

  return (
    <article className="event">
      {/* Hero: the cover, blurred, behind the title */}
      <header className="event-hero">
        {p.coverUrl && <img className="event-hero__backdrop" src={p.coverUrl} alt="" aria-hidden="true" />}
        <div className="container event-hero__inner">
          <Link to={isAnnouncement ? '/activities?tab=announcements' : '/activities'} className="event-hero__back">
            <HiArrowLeft aria-hidden="true" /> {isAnnouncement ? 'All announcements' : 'Community activities'}
          </Link>
          <div className="event-hero__tags">
            <span className={`event-badge event-badge--${status.key}`}>{status.label}</span>
            {p.program && (
              <span className="event-tag">
                <HiOutlineSparkles aria-hidden="true" /> {p.program.name}
              </span>
            )}
          </div>
          <h1>{p.title}</h1>
          <ul className="event-hero__meta">
            <li>
              <HiOutlineCalendarDays aria-hidden="true" />
              <time dateTime={p.eventDate}>{formatDate(p.eventDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</time>
            </li>
            {where && (
              <li>
                <HiOutlineMapPin aria-hidden="true" /> {where}
              </li>
            )}
            {photos.length > 0 && (
              <li>
                <HiOutlinePhoto aria-hidden="true" /> {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </li>
            )}
          </ul>
        </div>
      </header>

      {p.coverUrl && (
        <div className="container">
          <img src={p.coverUrl} alt="" className="event-cover" />
        </div>
      )}

      <div className={`container event-layout${p.coverUrl ? '' : ' event-layout--no-cover'}`}>
        <div className="event-main">
          {(p.summary || body.length > 0) && (
            <div className="prose event-prose">
              {p.summary && <p className="event-lead">{p.summary}</p>}
              {body.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <section className="event-gallery" aria-labelledby="gallery-title">
              <div className="event-section-head">
                <h2 id="gallery-title">Photo documentation</h2>
                <span>
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · click to enlarge
                </span>
              </div>
              <ul className={`event-gallery__grid event-gallery__grid--${Math.min(photos.length, 5)}`}>
                {photos.map((photo, i) => (
                  <li key={photo.fileId}>
                    <button type="button" onClick={() => setViewing(i)} aria-label={`View photo ${i + 1}${photo.caption ? `: ${photo.caption}` : ''}`}>
                      <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" />
                      {photo.caption && <span className="event-gallery__caption">{photo.caption}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="event-aside">
          <div className="event-card">
            <div className="event-card__date">
              <span className="event-card__month">{date.toLocaleDateString('en-PH', { month: 'short' })}</span>
              <strong>{date.getDate()}</strong>
              <span className="event-card__year">{date.getFullYear()}</span>
            </div>
            <p className="event-card__relative">{relativeDay(p.eventDate)}</p>

            <dl className="event-card__details">
              <div>
                <dt>
                  <HiOutlineCalendarDays aria-hidden="true" /> {isAnnouncement ? 'Posted' : 'When'}
                </dt>
                <dd>{formatDate(p.eventDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</dd>
              </div>
              {where && (
                <div>
                  <dt>
                    <HiOutlineMapPin aria-hidden="true" /> Where
                  </dt>
                  <dd>
                    {p.location && <span>{p.location}</span>}
                    {p.barangay && <Link to="/partner-communities">{p.barangay.name}</Link>}
                  </dd>
                </div>
              )}
              {p.program && (
                <div>
                  <dt>
                    <HiOutlineSparkles aria-hidden="true" /> Program
                  </dt>
                  <dd>
                    <Link to="/programs-services">{p.program.name}</Link>
                  </dd>
                </div>
              )}
              {p.college && (
                <div>
                  <dt>
                    <HiOutlineBuildingLibrary aria-hidden="true" /> Organized by
                  </dt>
                  <dd>
                    <Link to={`/colleges/${p.college.slug}`}>{p.college.name}</Link>
                  </dd>
                </div>
              )}
            </dl>

            {status.key === 'upcoming' && (
              <Link to="/contact?topic=partnership" className="btn btn--gold event-card__cta">
                Coordinate with CRO <HiArrowRight aria-hidden="true" />
              </Link>
            )}
            <ShareButtons title={p.title} />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="section section--tinted event-related" aria-labelledby="related-title">
          <div className="container">
            <div className="event-section-head">
              <h2 id="related-title">More community activities</h2>
              <Link to="/activities" className="event-related__all">
                See all <HiArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="post-grid">
              {others.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {viewing !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo" onClick={() => setViewing(null)} onKeyDown={(e) => {
          if (e.key === 'Escape') setViewing(null)
          if (e.key === 'ArrowRight') show(viewing + 1)
          if (e.key === 'ArrowLeft') show(viewing - 1)
        }}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[viewing].url} alt={photos[viewing].caption ?? ''} />
            <figcaption>
              {photos[viewing].caption && <span>{photos[viewing].caption}</span>}
              {photos.length > 1 && (
                <span className="lightbox__count">
                  {viewing + 1} / {photos.length}
                </span>
              )}
            </figcaption>
          </figure>
          <button type="button" className="lightbox__close" onClick={() => setViewing(null)} aria-label="Close" autoFocus>
            <HiXMark />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" className="lightbox__prev" onClick={(e) => { e.stopPropagation(); show(viewing - 1) }} aria-label="Previous photo">
                <HiChevronLeft />
              </button>
              <button type="button" className="lightbox__next" onClick={(e) => { e.stopPropagation(); show(viewing + 1) }} aria-label="Next photo">
                <HiChevronRight />
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url) // clipboard blocked (e.g. not HTTPS)
    }
  }

  return (
    <div className="event-share">
      <span>Share</span>
      <button type="button" onClick={copy} aria-label={`Copy the link to ${title}`}>
        {copied ? <HiOutlineCheck aria-hidden="true" /> : <HiOutlineLink aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
        <FaFacebookF aria-hidden="true" /> Facebook
      </a>
    </div>
  )
}
