import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlinePlus } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { listColleges, listContent } from '../../api/admin.api.js'
import { CONTENT_STATUS_LABELS, RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import SearchBox from '../shared/SearchBox.jsx'
import { formatDate } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'
import { StatusPill } from './Workflow.jsx'

const fetchMaterials = (params) => listContent('resources', params)

// Learning resources repository (requirements Step 4: College → Topic → Type of Material → Publication).
export default function MaterialList() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const list = useListPage(fetchMaterials)
  const { data } = list
  const [colleges, setColleges] = useState([])
  const [notice, setNotice] = useState(location.state?.notice ?? null)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
  }, [])

  return (
    <section className="admin-panel data-panel" aria-labelledby="materials-title">
      <div className="data-panel__top">
        <div>
          <h2 id="materials-title">Learning materials</h2>
          <p className="data-panel__meta">
            {data && `${data.total} ${data.total === 1 ? 'material' : 'materials'}${list.filtered ? ' found' : ''}`}
            {user.college && ` · ${user.college.name}`}
          </p>
        </div>
        <div className="data-panel__tools">
          <SearchBox label="Search materials" placeholder="Title or topic" value={list.searchInput} onChange={list.setSearchInput} />
          <FilterSelect label="Status" allLabel="Any status" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={Object.entries(CONTENT_STATUS_LABELS)} />
          <FilterSelect label="Type" allLabel="All types" value={list.filters.type} onChange={(v) => list.setFilter('type', v)} options={Object.entries(RESOURCE_TYPE_LABELS)} />
          {!user.college && (
            <FilterSelect label="College" allLabel="All colleges" value={list.filters.collegeId} onChange={(v) => list.setFilter('collegeId', v)} options={colleges.map((c) => [c.id, c.code])} />
          )}
          <Link to="/admin/cms/materials/new" className="btn btn--purple">
            <HiOutlinePlus aria-hidden="true" /> Add material
          </Link>
        </div>
      </div>

      {notice && (
        <div className="admin-notice admin-notice--success" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}

      {list.loading && <p className="data-empty">Loading…</p>}
      {list.error && <p className="data-empty">Couldn't load materials. Please refresh the page.</p>}
      {data?.items.length === 0 && (
        <p className="data-empty">{list.filtered ? 'No materials match your filters.' : 'No learning materials yet. Add the first one.'}</p>
      )}
      {data?.items.length > 0 && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">College</th>
                <th scope="col">Topic</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="is-clickable" onClick={() => navigate(`/admin/cms/materials/${r.id}`)}>
                  <td data-label="Material">
                    <Link to={`/admin/cms/materials/${r.id}`} onClick={(e) => e.stopPropagation()} className="strong-link">
                      {r.title}
                    </Link>
                    {r.isFeatured && <span className="tag">Featured</span>}
                    {r.createdByName && <span className="cell-sub">by {r.createdByName}</span>}
                  </td>
                  <td data-label="College">{r.college.code}</td>
                  <td data-label="Topic">{r.topic}</td>
                  <td data-label="Type">{RESOURCE_TYPE_LABELS[r.type]}</td>
                  <td data-label="Status">
                    <StatusPill status={r.status} />
                  </td>
                  <td data-label="Updated" className="data-table__muted">
                    {formatDate(r.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPage={list.goTo} />
        </>
      )}
    </section>
  )
}
