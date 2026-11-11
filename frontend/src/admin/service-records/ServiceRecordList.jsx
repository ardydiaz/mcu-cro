import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlinePlus } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { listColleges, listPrograms, listServiceRecords } from '../../api/admin.api.js'
import { SERVICE_EDITORS } from '../../constants/roles.js'
import { FOLLOW_UP_LABELS, SERVICE_TYPE_LABELS } from '../../constants/services.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import SearchBox from '../shared/SearchBox.jsx'
import { formatDate } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'

// "Scheduled · Nov 20" etc.
export function FollowUpBadge({ status, date }) {
  if (status === 'none') return <span className="data-table__muted">—</span>
  return (
    <span className={`pill pill--${status}`}>
      {FOLLOW_UP_LABELS[status]}
      {date && ` · ${formatDate(date)}`}
    </span>
  )
}

export default function ServiceRecordList() {
  const { user, hasRole } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const list = useListPage(listServiceRecords)
  const { data } = list
  const [colleges, setColleges] = useState([])
  const [programs, setPrograms] = useState([])
  const [notice, setNotice] = useState(location.state?.notice ?? null)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
    listPrograms().then(setPrograms, () => {})
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page__header page-header-actions">
        <div>
          <h1>Service Records</h1>
          <p>
            Services received by beneficiaries from MCU colleges and departments
            {user.college && ` · showing ${user.college.name} only`}.
          </p>
        </div>
        {hasRole(...SERVICE_EDITORS) && (
          <Link to="new" className="btn btn--purple">
            <HiOutlinePlus aria-hidden="true" /> Record service
          </Link>
        )}
      </div>

      <section className="admin-panel data-panel" aria-labelledby="services-title">
        <div className="data-panel__top">
          <div>
            <h2 id="services-title">Services rendered</h2>
            <p className="data-panel__meta">
              {data && `${data.total.toLocaleString()} ${data.total === 1 ? 'record' : 'records'}${list.filtered ? ' found' : ''}`}
            </p>
          </div>
          <div className="data-panel__tools">
            <SearchBox label="Search by beneficiary" placeholder="Beneficiary name or BEN-ID" value={list.searchInput} onChange={list.setSearchInput} />
            {!user.college && (
              <FilterSelect
                label="College or department"
                allLabel="All colleges"
                value={list.filters.collegeId}
                onChange={(v) => list.setFilter('collegeId', v)}
                options={colleges.map((c) => [c.id, c.code])}
              />
            )}
            <FilterSelect
              label="Type of service"
              allLabel="All services"
              value={list.filters.serviceType}
              onChange={(v) => list.setFilter('serviceType', v)}
              options={Object.entries(SERVICE_TYPE_LABELS)}
            />
            <FilterSelect
              label="Program"
              allLabel="All programs"
              value={list.filters.programId}
              onChange={(v) => list.setFilter('programId', v)}
              options={programs.map((p) => [p.id, p.name])}
            />
            <FilterSelect
              label="Follow-up"
              allLabel="Any follow-up"
              value={list.filters.followUpStatus}
              onChange={(v) => list.setFilter('followUpStatus', v)}
              options={Object.entries(FOLLOW_UP_LABELS)}
            />
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

        {list.loading && <p className="data-empty">Loading service records…</p>}
        {list.error && <p className="data-empty">Couldn't load service records. Please refresh the page.</p>}
        {data?.items.length === 0 && (
          <p className="data-empty">{list.filtered ? 'No service records match your search or filters.' : 'No service records yet.'}</p>
        )}

        {data?.items.length > 0 && (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Beneficiary</th>
                  <th scope="col">Service</th>
                  <th scope="col">College</th>
                  <th scope="col">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="is-clickable" onClick={() => navigate(String(s.id))}>
                    <td data-label="Date" className="nowrap">
                      <Link to={String(s.id)} onClick={(e) => e.stopPropagation()} className="strong-link">
                        {formatDate(s.serviceDate)}
                      </Link>
                      <span className="cell-sub">{s.code}</span>
                    </td>
                    <td data-label="Beneficiary">
                      {s.beneficiary.name}
                      <span className="cell-sub">{s.beneficiary.code}</span>
                    </td>
                    <td data-label="Service">
                      {SERVICE_TYPE_LABELS[s.serviceType]}
                      {s.referralCount > 0 && <span className="tag">Referred</span>}
                      <span className="cell-sub">{s.program?.name ?? 'No program'}</span>
                    </td>
                    <td data-label="College">
                      <span title={s.college.name}>{s.college.code}</span>
                    </td>
                    <td data-label="Follow-up">
                      <FollowUpBadge status={s.followUpStatus} date={s.followUpDate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onPage={list.goTo} />
          </>
        )}
      </section>
    </div>
  )
}
