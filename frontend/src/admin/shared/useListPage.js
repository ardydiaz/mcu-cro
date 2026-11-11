import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// State for a searchable, filterable, paginated list page. Filters live in the
// URL (named like the API's query parameters), so Back and shared links keep them.
//   const list = useListPage(listBeneficiaries)
//   list.filters.sex, list.setFilter('sex', 'female'), list.data?.items, list.goTo(2)
export default function useListPage(fetchPage, pageSize = 20) {
  const [params, setParams] = useSearchParams()
  const [version, setVersion] = useState(0) // bumped by reload()
  const key = `${params}#${version}`
  const filters = Object.fromEntries(params)
  const page = Number(params.get('page')) || 1
  const search = params.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(search)
  const [result, setResult] = useState({ key: null }) // { key, data } or { key, error }

  const setFilter = (name, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(name, value)
        else next.delete(name)
        next.delete('page')
        return next
      },
      { replace: true },
    )

  const goTo = (n) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(n))
      return next
    })

  // Debounced search box → URL.
  useEffect(() => {
    if (searchInput.trim() === search) return
    const id = setTimeout(() => setFilter('search', searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let current = true
    fetchPage({ ...filters, page, pageSize }).then(
      (data) => current && setResult({ key, data }),
      (error) => current && setResult({ key, error }),
    )
    return () => {
      current = false
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = result.key !== key
  return {
    filters,
    page,
    pageSize,
    searchInput,
    setSearchInput,
    setFilter,
    goTo,
    reload: () => setVersion((v) => v + 1),
    loading,
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    filtered: [...params.keys()].some((k) => k !== 'page'),
  }
}
