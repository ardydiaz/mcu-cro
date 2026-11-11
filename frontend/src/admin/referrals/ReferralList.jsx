import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlinePlus } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { listColleges, listReferrals } from '../../api/admin.api.js'
import { SERVICE_EDITORS } from '../../constants/roles.js'
import { REFERRAL_STATUS_LABELS, URGENCY_LABELS } from '../../constants/services.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import SearchBox from '../shared/SearchBox.jsx'
import { destinationOf, formatDate } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'

export const StatusPill = ({ status }) => <span className={`pill pill--${status}`}>{REFERRAL_STATUS_LABELS[status]}</span>

export const UrgencyPill = ({ urgency }) =>
  urgency === 'routine' ? <span className="data-table__muted">Routine</span> : <span className={`pill pill--${urgency}`}>{URGENCY_LABELS[urgency]}</span>

// Compact row for referral lists on other pages (profile, service record).
export function ReferralRow({ referral: r, showBeneficiary = false }) {
  return (
    <li>
      <Link to={`/admin/referrals/${r.id}`}>
        <span className="mini-list__main">
          <strong>To {destinationOf(r)}</strong>
          <small>
            {formatDate(r.referralDate)} · from {r.college.code}
            {showBeneficiary && ` · ${r.beneficiary.name}`}
          </small>
        </span>
        <StatusPill status={r.status} />
      </Link>
    </li>
  )
}

const STATUS_FILTERS = [['open', 'Open (pending + in progress)'], ...Object.entries(REFERRAL_STATUS_LABELS)]

export default function ReferralList() {
  const { user, hasRole } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const list = useListPage(listReferrals)
  const { data } = list
  const [colleges, setColleges] = useState([])
  const [notice, setNotice] = useState(location.state?.notice ?? null)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page__header page-header-actions">
        <div>
          <h1>Referrals</h1>
          <p>
            Beneficiaries referred to another MCU college or an outside facility
            {user.college && ` · showing referrals from or to ${user.college.name}`}.
          </p>
        </div>
        {hasRole(...SERVICE_EDITORS) && (
          <Link to="new" className="btn btn--purple">
            <HiOutlinePlus aria-hidden="true" /> New referral
          </Link>
        )}
      </div>

      <section className="admin-panel data-panel" aria-labelledby="referrals-title">
        <div className="data-panel__top">
          <div>
            <h2 id="referrals-title">Referral records</h2>
            <p className="data-panel__meta">
              {data && `${data.total.toLocaleString()} ${data.total === 1 ? 'referral' : 'referrals'}${list.filtered ? ' found' : ''}`}
            </p>
          </div>
          <div className="data-panel__tools">
            <SearchBox label="Search by beneficiary" placeholder="Beneficiary name or BEN-ID" value={list.searchInput} onChange={list.setSearchInput} />
            <FilterSelect label="Status" allLabel="All statuses" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_FILTERS} />
            <FilterSelect
              label="Urgency"
              allLabel="Any urgency"
              value={list.filters.urgency}
              onChange={(v) => list.setFilter('urgency', v)}
              options={Object.entries(URGENCY_LABELS)}
            />
            {!user.college && (
              <FilterSelect
                label="College or department"
                allLabel="All colleges"
                value={list.filters.collegeId}
                onChange={(v) => list.setFilter('collegeId', v)}
                options={colleges.map((c) => [c.id, c.code])}
              />
            )}
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

        {list.loading && <p className="data-empty">Loading referrals…</p>}
        {list.error && <p className="data-empty">Couldn't load referrals. Please refresh the page.</p>}
        {data?.items.length === 0 && <p className="data-empty">{list.filtered ? 'No referrals match your search or filters.' : 'No referrals yet.'}</p>}

        {data?.items.length > 0 && (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Beneficiary</th>
                  <th scope="col">Referred to</th>
                  <th scope="col">From</th>
                  <th scope="col">Urgency</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="is-clickable" onClick={() => navigate(String(r.id))}>
                    <td data-label="Date" className="nowrap">
                      <Link to={String(r.id)} onClick={(e) => e.stopPropagation()} className="strong-link">
                        {formatDate(r.referralDate)}
                      </Link>
                      <span className="cell-sub">{r.code}</span>
                    </td>
                    <td data-label="Beneficiary">
                      {r.beneficiary.name}
                      <span className="cell-sub">{r.beneficiary.code}</span>
                    </td>
                    <td data-label="Referred to">
                      {destinationOf(r)}
                      <span className="cell-sub">{r.referredToCollege ? 'MCU college/department' : 'Outside facility'}</span>
                    </td>
                    <td data-label="From">
                      <span title={r.college.name}>{r.college.code}</span>
                    </td>
                    <td data-label="Urgency">
                      <UrgencyPill urgency={r.urgency} />
                    </td>
                    <td data-label="Status">
                      <StatusPill status={r.status} />
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
