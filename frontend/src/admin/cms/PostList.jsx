import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlinePlus } from 'react-icons/hi2'
import { listContent } from '../../api/admin.api.js'
import { CONTENT_STATUS_LABELS, POST_KIND_LABELS } from '../../constants/content.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import SearchBox from '../shared/SearchBox.jsx'
import { formatDate } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'
import { StatusPill } from './Workflow.jsx'

const fetchPosts = (params) => listContent('posts', params)

// Community activities (upcoming, past, documentation) and announcements.
export default function PostList() {
  const navigate = useNavigate()
  const location = useLocation()
  const list = useListPage(fetchPosts)
  const { data } = list
  const [notice, setNotice] = useState(location.state?.notice ?? null)

  return (
    <section className="admin-panel data-panel" aria-labelledby="posts-title">
      <div className="data-panel__top">
        <div>
          <h2 id="posts-title">Activities & announcements</h2>
          <p className="data-panel__meta">{data && `${data.total} ${data.total === 1 ? 'post' : 'posts'}${list.filtered ? ' found' : ''}`}</p>
        </div>
        <div className="data-panel__tools">
          <SearchBox label="Search posts" placeholder="Title" value={list.searchInput} onChange={list.setSearchInput} />
          <FilterSelect label="Kind" allLabel="Activities & announcements" value={list.filters.kind} onChange={(v) => list.setFilter('kind', v)} options={Object.entries(POST_KIND_LABELS)} />
          <FilterSelect label="Status" allLabel="Any status" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={Object.entries(CONTENT_STATUS_LABELS)} />
          <Link to="/admin/cms/posts/new" className="btn btn--purple">
            <HiOutlinePlus aria-hidden="true" /> New post
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
      {list.error && <p className="data-empty">Couldn't load posts. Please refresh the page.</p>}
      {data?.items.length === 0 && <p className="data-empty">{list.filtered ? 'No posts match your filters.' : 'No activities or announcements yet.'}</p>}
      {data?.items.length > 0 && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Kind</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="is-clickable" onClick={() => navigate(`/admin/cms/posts/${p.id}`)}>
                  <td data-label="Title">
                    <Link to={`/admin/cms/posts/${p.id}`} onClick={(e) => e.stopPropagation()} className="strong-link">
                      {p.title}
                    </Link>
                    {p.isFeatured && <span className="tag">Featured</span>}
                    <span className="cell-sub">{[p.college?.code, p.barangay?.name, p.program?.name].filter(Boolean).join(' · ') || ' '}</span>
                  </td>
                  <td data-label="Kind">{POST_KIND_LABELS[p.kind]}</td>
                  <td data-label="Date" className="nowrap">
                    {formatDate(p.eventDate)}
                  </td>
                  <td data-label="Status">
                    <StatusPill status={p.status} />
                  </td>
                  <td data-label="Updated" className="data-table__muted">
                    {formatDate(p.updatedAt)}
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
