import { useEffect, useRef } from 'react'

// Fades in every `.reveal` element inside the returned ref as it scrolls into view.
export default function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.reveal') ?? []
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}
