import { useEffect, useRef } from 'react'

// Fades in every `.reveal` element inside the returned ref as it scrolls into view.
// Pass `deps` that change when more content renders (e.g. after loading data)
// so the new elements are picked up too.
export default function useReveal(deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.reveal:not(.is-visible)') ?? []
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
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return ref
}
