import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiOutlineMagnifyingGlass, HiOutlineBookOpen } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { EmptyState, PagePager, ResourceCard } from '../../components/content/ContentCards.jsx'
import { listColleges, listResources, listTopics } from '../../api/public.api.js'
import { RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

const PAGE_SIZE = 12

// Requirements §5 Learning Resources: videos, learning modules, health information
// materials and educational presentations, organized by college → topic → type.
export default function LearningResourcesPage() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params)
  const page = Number(filters.page) || 1
  const [search, setSearch] = useState(filters.search ?? '')
  const [colleges, setColleges] = useState([])
  const [topics, setTopics] = useState([])

  useEffect(() => {
    listColleges().then(setColleges, () => {})
    listTopics().then(setTopics, () => {})
  }, [])

  const setFilter = (name, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(name, value)
        else next.delete(name)
        if (name !== 'page') next.delete('page')
        return next
      },
      { replace: name !== 'page' },
    )

  useEffect(() => {
    if (search.trim() === (filters.search ?? '')) return
    const id = setTimeout(() => setFilter('search', search.trim()), 350)
    return () => clearTimeout(id)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, error, loading } = useApi(() => listResources({ ...filters, page, pageSize: PAGE_SIZE }), [params.toString()])
  const filtered = ['search', 'collegeId', 'type', 'topic'].some((k) => filters[k])

  return (
    <>
      <PageHero eyebrow="Learn with MCU" title="Learning Resources">
        Videos, learning modules, health information and presentations prepared by MCU colleges and departments for our
        partner communities.
      </PageHero>

      <div className="container section">
        <div className="filter-bar" role="search">
          <label className="filter-bar__search">
            <HiOutlineMagnifyingGlass aria-hidden="true" />
            <span className="visually-hidden">Search learning resources</span>
            <input type="search" placeholder="Search topics and titles…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            <span className="visually-hidden">College or department</span>
            <select value={filters.collegeId ?? ''} onChange={(e) => setFilter('collegeId', e.target.value)}>
              <option value="">All colleges & departments</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Type of material</span>
            <select value={filters.type ?? ''} onChange={(e) => setFilter('type', e.target.value)}>
              <option value="">All types</option>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {topics.length > 0 && (
          <div className="topic-chips" aria-label="Topics">
            <button type="button" className={!filters.topic ? 'is-active' : ''} onClick={() => setFilter('topic', '')}>
              All topics
            </button>
            {topics.map(({ topic, count }) => (
              <button key={topic} type="button" className={filters.topic === topic ? 'is-active' : ''} onClick={() => setFilter('topic', topic)}>
                {topic} <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {loading && <p className="loading-note">Loading materials…</p>}
        {error && <p className="loading-note">We couldn't load the materials. Please try again later.</p>}
        {data?.items.length === 0 &&
          (filtered ? (
            <EmptyState icon={HiOutlineMagnifyingGlass} title="No materials found">
              Try another topic, type or college.
            </EmptyState>
          ) : (
            <EmptyState icon={HiOutlineBookOpen} title="Materials are on the way">
              MCU colleges and departments are preparing their learning materials. Please check back soon.
            </EmptyState>
          ))}
        {data?.items.length > 0 && (
          <>
            <p className="result-count">
              {data.total} {data.total === 1 ? 'material' : 'materials'}
            </p>
            <div className="resource-grid">
              {data.items.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
            <PagePager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={(n) => setFilter('page', String(n))} />
          </>
        )}
      </div>
    </>
  )
}
