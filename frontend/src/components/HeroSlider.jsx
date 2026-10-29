import { useCallback, useEffect, useState } from 'react'
import { HiChevronLeft, HiChevronRight, HiPause, HiPlay } from 'react-icons/hi'
import './hero-slider.css'

const INTERVAL = 6000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Full-bleed crossfading background slider. Content is passed as children.
export default function HeroSlider({ slides, children, label = 'Highlights' }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())

  const go = useCallback((i) => setIndex((i + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (!playing || slides.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL)
    return () => clearInterval(id)
  }, [playing, slides.length, index])

  return (
    <section className="hero" aria-roledescription="carousel" aria-label={label}>
      <div className="hero__slides">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero__slide${i === index ? ' is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
          </div>
        ))}
      </div>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__content">{children}</div>

      {slides.length > 1 && (
        <div className="container hero__controls">
          <div className="hero__dots" role="group" aria-label="Choose slide">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                className={`hero__dot${i === index ? ' is-active' : ''}`}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
              >
                <span style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: playing ? 'running' : 'paused' }} />
              </button>
            ))}
          </div>
          <div className="hero__buttons">
            <button type="button" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setPlaying((p) => !p)}>
              {playing ? <HiPause /> : <HiPlay />}
            </button>
            <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)}>
              <HiChevronLeft />
            </button>
            <button type="button" aria-label="Next slide" onClick={() => go(index + 1)}>
              <HiChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
