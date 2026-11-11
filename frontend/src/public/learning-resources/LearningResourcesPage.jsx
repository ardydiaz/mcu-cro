import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineBuildingLibrary,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiXMark,
} from 'react-icons/hi2'
import { EmptyState, PagePager, ResourceCard } from '../../components/content/ContentCards.jsx'
import { TYPE_ICONS } from '../../components/content/resourceTypes.js'
import { listColleges, listResources, listTopics } from '../../api/public.api.js'
import { RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import useApi from '../../hooks/useApi.js'
import '../../components/page-hero.css'
import '../public-pages.css'

const PAGE_SIZE = 12
const TYPE_TABS = [['', 'All materials', HiOutlineSquares2X2], ...Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => [value, label, TYPE_ICONS[value]])]

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
  const college = colleges.find((c) => String(c.id) === filters.collegeId)

  // Figures for the hero (published materials only).
  const totalMaterials = topics.reduce((sum, t) => sum + Number(t.count), 0)
  const contributing = colleges.filter((c) => c.resourceCount > 0).length

  function clearAll() {
    setSearch('')
    setParams({}, { replace: true })
  }

  return (
    <>
      <section className="page-hero lr-hero">
        <div className="container">
          <span className="page-hero__eyebrow">Learn with MCU</span>
          <h1>Learning Resources</h1>
          <p>
            Videos, learning modules, health information and presentations prepared by MCU colleges and departments for
            our partner communities.
          </p>

          <label className="lr-search" role="search">
            <HiOutlineMagnifyingGlass aria-hidden="true" />
            <span className="visually-hidden">Search learning resources</span>
            <input type="search" placeholder="Search a topic or title, e.g. dengue, diabetes, ngipin…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <HiXMark />
              </button>
            )}
          </label>

          {totalMaterials > 0 && (
            <ul className="lr-stats">
              <li>
                <HiOutlineBookOpen aria-hidden="true" /> <strong>{totalMaterials}</strong> materials
              </li>
              <li>
                <HiOutlineTag aria-hidden="true" /> <strong>{topics.length}</strong> health topics
              </li>
              <li>
                <HiOutlineAcademicCap aria-hidden="true" /> <strong>{contributing}</strong> colleges &amp; departments
              </li>
            </ul>
          )}
        </div>
      </section>

      <div className="container section lr-body">
        {/* Type of material */}
        <nav className="lr-types" aria-label="Type of material">
          {TYPE_TABS.map(([value, label, Icon]) => (
            <button
              key={value || 'all'}
              type="button"
              className={(filters.type ?? '') === value ? 'is-active' : ''}
              aria-pressed={(filters.type ?? '') === value}
              onClick={() => setFilter('type', value)}
            >
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {/* Topic and college */}
        <div className="lr-toolbar">
          {topics.length > 0 && (
            <div className="lr-topics" aria-label="Topics">
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
          <label className="lr-college">
            <HiOutlineBuildingLibrary aria-hidden="true" />
            <span className="visually-hidden">College or department</span>
            <select value={filters.collegeId ?? ''} onChange={(e) => setFilter('collegeId', e.target.value)}>
              <option value="">All colleges & departments</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.resourceCount ? ` (${c.resourceCount})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Results header with the active filters */}
        {data && (
          <div className="lr-results">
            <p className="lr-results__count">
              <strong>{data.total}</strong> {data.total === 1 ? 'material' : 'materials'}
              {filters.search && <> for “{filters.search}”</>}
            </p>
            {filtered && (
              <ul className="lr-active">
                {filters.type && (
                  <li>
                    {RESOURCE_TYPE_LABELS[filters.type]}
                    <button type="button" onClick={() => setFilter('type', '')} aria-label="Remove type filter">
                      <HiXMark />
                    </button>
                  </li>
                )}
                {filters.topic && (
                  <li>
                    {filters.topic}
                    <button type="button" onClick={() => setFilter('topic', '')} aria-label="Remove topic filter">
                      <HiXMark />
                    </button>
                  </li>
                )}
                {college && (
                  <li>
                    {college.code}
                    <button type="button" onClick={() => setFilter('collegeId', '')} aria-label="Remove college filter">
                      <HiXMark />
                    </button>
                  </li>
                )}
                <li className="lr-active__clear">
                  <button type="button" onClick={clearAll}>
                    Clear all
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}

        {loading && !data && (
          <div className="resource-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="resource-skeleton" />
            ))}
          </div>
        )}
        {error && <p className="loading-note">We couldn't load the materials. Please try again later.</p>}
        {data?.items.length === 0 &&
          (filtered ? (
            <EmptyState icon={HiOutlineMagnifyingGlass} title="No materials found">
              Try another topic, type or college, or{' '}
              <button type="button" className="link-button" onClick={clearAll}>
                clear all filters
              </button>
              .
            </EmptyState>
          ) : (
            <EmptyState icon={HiOutlineBookOpen} title="Materials are on the way">
              MCU colleges and departments are preparing their learning materials. Please check back soon.
            </EmptyState>
          ))}
        {data?.items.length > 0 && (
          <>
            <div className={`resource-grid${loading ? ' is-loading' : ''}`}>
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
