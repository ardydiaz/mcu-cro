import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowUpRight, HiChevronLeft, HiChevronRight, HiOutlineCalendarDays, HiOutlineMapPin } from 'react-icons/hi2'
import { formatDate } from '../../components/content/contentFormat.js'

const INTERVAL = 6000
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Hero card that cycles through upcoming activities, then the latest stories.
// Pauses on hover and keyboard focus; arrows and dots move it by hand.
export default function HighlightSlider({ items }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length
  const current = Math.min(index, count - 1)

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL)
    return () => clearInterval(id)
  }, [count, paused])

  if (count === 0) return null
  const go = (i) => setIndex((i + count) % count)

  return (
    <section
      className={`highlight${paused || reducedMotion ? ' is-paused' : ''}`}
      aria-roledescription="carousel"
      aria-label="Upcoming activities and latest stories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="highlight__track">
        {items.map(({ post, label }, i) => (
          <Link
            key={post.id}
            to={`/activities/${post.slug}`}
            className={`highlight__slide${i === current ? ' is-active' : ''}`}
            aria-hidden={i !== current}
            tabIndex={i === current ? 0 : -1}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${label}, ${post.title}`}
          >
            <span className="highlight__media">
              {post.coverUrl ? <img src={post.coverUrl} alt="" loading={i === 0 ? 'eager' : 'lazy'} /> : <span className="highlight__placeholder" />}
              <span className="highlight__date" aria-hidden="true">
                <small>{formatDate(post.eventDate, { month: 'short' })}</small>
                {formatDate(post.eventDate, { day: 'numeric' })}
              </span>
              <HiArrowUpRight className="highlight__arrow" aria-hidden="true" />
            </span>
            <span className="highlight__body">
              <span className={`highlight__label${label === 'Upcoming activity' ? ' is-upcoming' : ''}`}>{label}</span>
              <strong>{post.title}</strong>
              <span className="highlight__meta">
                <span>
                  <HiOutlineCalendarDays aria-hidden="true" />
                  <time dateTime={post.eventDate}>{formatDate(post.eventDate)}</time>
                </span>
                {post.location && (
                  <span>
                    <HiOutlineMapPin aria-hidden="true" /> {post.location}
                  </span>
                )}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <div className="highlight__controls">
          <button type="button" onClick={() => go(current - 1)} aria-label="Previous">
            <HiChevronLeft />
          </button>
          <div className="highlight__dots">
            {items.map(({ post }, i) => (
              <button
                key={post.id}
                type="button"
                className={i === current ? 'is-active' : ''}
                onClick={() => go(i)}
                aria-label={`Show ${i + 1} of ${count}`}
                aria-current={i === current}
              >
                {/* progress bar until the next slide; restarts on every slide */}
                {i === current && !paused && !reducedMotion && count > 1 && <span key={current} style={{ animationDuration: `${INTERVAL}ms` }} />}
              </button>
            ))}
          </div>
          <span className="highlight__count" aria-live="polite">
            {current + 1} / {count}
          </span>
          <button type="button" onClick={() => go(current + 1)} aria-label="Next">
            <HiChevronRight />
          </button>
        </div>
      )}
    </section>
  )
}
