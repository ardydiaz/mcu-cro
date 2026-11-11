import { useEffect, useState } from 'react'

// Loads data for a page: const { data, error, loading } = useApi(() => getPost(slug), [slug])
// Results from an earlier `key` are ignored, so fast navigation never shows stale data.
export default function useApi(load, deps) {
  const key = JSON.stringify(deps)
  const [result, setResult] = useState({ key: null })

  useEffect(() => {
    let current = true
    load().then(
      (data) => current && setResult({ key, data }),
      (error) => current && setResult({ key, error }),
    )
    return () => {
      current = false
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = result.key !== key
  return { loading, data: loading ? undefined : result.data, error: loading ? undefined : result.error }
}
