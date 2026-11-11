import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineCalendarDays, HiOutlineMapPin, HiXMark, HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import { EmptyState } from '../../components/content/ContentCards.jsx'
import { formatDate, paragraphs } from '../../components/content/contentFormat.js'
import { getPost } from '../../api/public.api.js'
import { POST_KIND_LABELS } from '../../constants/content.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

// One activity (with its photo documentation) or announcement.
export default function PostPage() {
  const { slug } = useParams()
  const { data: p, error, loading } = useApi(() => getPost(slug), [slug])
  const [viewing, setViewing] = useState(null) // index of the photo shown large

  if (loading) return <p className="container section loading-note">Loading…</p>
  if (error) {
    return (
      <div className="container section">
        <EmptyState title="This page is not available">
          <Link to="/activities">See all community activities</Link>.
        </EmptyState>
      </div>
    )
  }

  const photos = p.photos ?? []
  const show = (i) => setViewing((i + photos.length) % photos.length)

  return (
    <article className="container section detail-page">
      <Link to={p.kind === 'announcement' ? '/activities?tab=announcements' : '/activities'} className="detail-page__back">
        <HiArrowLeft aria-hidden="true" /> {p.kind === 'announcement' ? 'Announcements' : 'Community activities'}
      </Link>
      <header className="detail-page__head">
        <span className="eyebrow">{p.program?.name ?? POST_KIND_LABELS[p.kind]}</span>
        <h1>{p.title}</h1>
        <p className="detail-page__meta">
          <span>
            <HiOutlineCalendarDays aria-hidden="true" /> {formatDate(p.eventDate)}
          </span>
          {(p.location || p.barangay) && (
            <span>
              <HiOutlineMapPin aria-hidden="true" /> {[p.location, p.barangay?.name].filter(Boolean).join(', ')}
            </span>
          )}
          {p.college && <Link to={`/colleges/${p.college.slug}`}>{p.college.name}</Link>}
        </p>
      </header>

      {p.coverUrl && <img src={p.coverUrl} alt="" className="detail-page__cover" />}

      <div className="prose">
        {p.summary && <p className="prose__lead">{p.summary}</p>}
        {paragraphs(p.body).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>

      {photos.length > 0 && (
        <section className="gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title">Photo documentation</h2>
          <ul>
            {photos.map((photo, i) => (
              <li key={photo.fileId}>
                <button type="button" onClick={() => setViewing(i)} aria-label={`View photo ${i + 1}${photo.caption ? `: ${photo.caption}` : ''}`}>
                  <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" />
                </button>
                {photo.caption && <span>{photo.caption}</span>}
              </li>
            ))}
          </ul>
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
            {photos[viewing].caption && <figcaption>{photos[viewing].caption}</figcaption>}
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
