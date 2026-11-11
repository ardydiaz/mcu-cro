import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getReport } from '../../api/admin.api.js'

// Loads a report with the filters in the URL (so Back, refresh and shared links
// keep them). `ready(filters)` can hold off loading until required filters are set.
export default function useReport(type, ready = () => true) {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params)
  const key = `${type}?${params}`
  const enabled = ready(filters)
  const [result, setResult] = useState({ key: null })

  useEffect(() => {
    if (!enabled) return
    let current = true
    getReport(type, filters).then(
      (report) => current && setResult({ key, report }),
      (error) => current && setResult({ key, error }),
    )
    return () => {
      current = false
    }
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Changes several filters at once; empty values are removed.
  const setFilters = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [name, value] of Object.entries(changes)) {
          if (value) next.set(name, value)
          else next.delete(name)
        }
        return next
      },
      { replace: true },
    )

  const loading = enabled && result.key !== key
  return {
    filters,
    setFilters,
    setFilter: (name, value) => setFilters({ [name]: value }),
    loading,
    report: enabled && !loading ? result.report : null,
    error: enabled && !loading ? result.error : null,
  }
}
