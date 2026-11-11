import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineCalendarDays, HiOutlineDocumentText, HiOutlineLanguage, HiOutlineMapPin, HiPlay } from 'react-icons/hi2'
import { LANGUAGE_LABELS, RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import { formatDate } from './contentFormat.js'
import { TYPE_ICONS } from './resourceTypes.js'
import './content.css'

// A learning material in a grid: video thumbnail or a type illustration, the
// college, topic, title, short description and language.
export function ResourceCard({ resource: r }) {
  const Icon = TYPE_ICONS[r.type] ?? HiOutlineDocumentText
  const thumb = r.video?.thumbnailUrl ?? (r.file?.mimeType.startsWith('image/') ? r.file.url : null)
  return (
    <article className={`resource-card resource-card--${r.type}`}>
      <Link to={`/learning-resources/${r.id}`} className="resource-card__link">
        <div className={`resource-card__media${thumb ? ' has-thumb' : ''}`}>
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" />
          ) : (
            <span className="resource-card__art" aria-hidden="true">
              <Icon />
            </span>
          )}
          {r.type === 'video' && thumb && (
            <span className="resource-card__play" aria-hidden="true">
              <HiPlay />
            </span>
          )}
          <span className="resource-card__type">
            <Icon aria-hidden="true" /> {RESOURCE_TYPE_LABELS[r.type]}
          </span>
          <span className="resource-card__college" title={r.college.name}>
            {r.college.code}
          </span>
        </div>
        <div className="resource-card__body">
          <span className="resource-card__topic">{r.topic}</span>
          <h3>{r.title}</h3>
          {r.description && <p>{r.description}</p>}
          <span className="resource-card__foot">
            {r.language && (
              <span>
                <HiOutlineLanguage aria-hidden="true" /> {LANGUAGE_LABELS[r.language]}
              </span>
            )}
            <span className="resource-card__open">
              {r.type === 'video' ? 'Watch' : 'Open'} <HiArrowRight aria-hidden="true" />
            </span>
          </span>
        </div>
      </Link>
    </article>
  )
}

// Today in the Philippines, fixed when the page loads (for "Upcoming" badges).
const TODAY = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)

// An activity or announcement: cover photo, date, title, summary.
export function PostCard({ post: p, compact = false }) {
  const upcoming = p.kind === 'activity' && p.eventDate >= TODAY
  return (
    <article className={`post-card${compact ? ' post-card--compact' : ''}${p.coverUrl ? '' : ' post-card--no-image'}`}>
      <Link to={`/activities/${p.slug}`} className="post-card__link">
        {p.coverUrl && (
          <div className="post-card__media">
            <img src={p.coverUrl} alt="" loading="lazy" />
            {upcoming && <span className="post-card__badge">Upcoming</span>}
          </div>
        )}
        <div className="post-card__body">
          <span className="post-card__meta">
            <HiOutlineCalendarDays aria-hidden="true" />
            <time dateTime={p.eventDate}>{formatDate(p.eventDate)}</time>
            {p.location && (
              <>
                <HiOutlineMapPin aria-hidden="true" /> {p.location}
              </>
            )}
          </span>
          <h3>{p.title}</h3>
          {!compact && p.summary && <p>{p.summary}</p>}
          <span className="post-card__more">
            {p.kind === 'announcement' ? 'Read announcement' : 'Read more'} <HiArrowRight aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}

// Responsive 16:9 player for YouTube / Vimeo / Facebook links.
export function VideoEmbed({ video, title }) {
  return (
    <div className="video-embed">
      <iframe
        src={video.embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}

export function EmptyState({ icon: Icon = HiOutlineDocumentText, title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  )
}

export function PagePager({ page, pageSize, total, onPage }) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <nav className="page-pager" aria-label="Pages">
      <button type="button" className="btn btn--outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button type="button" className="btn btn--outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}
