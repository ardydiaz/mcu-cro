import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiOutlineArrowUpTray, HiOutlineUserPlus } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { listBarangays, listBeneficiaries } from '../../api/admin.api.js'
import { SEX_LABELS } from '../../constants/beneficiaries.js'
import { BENEFICIARY_EDITORS, RECORD_MANAGERS, ROLES } from '../../constants/roles.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import SearchBox from '../shared/SearchBox.jsx'
import { ageOf, formatDate, initialsOf, listName } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'

// Which records the user sees (requirements Step 5).
function scopeNote(user, barangayCount) {
  if (user.roles.includes(ROLES.COORDINATOR)) {
    return barangayCount === 0
      ? 'No barangays are assigned to you yet. Ask the IT administrator to assign them in Settings.'
      : `Showing beneficiaries of your ${barangayCount === 1 ? 'assigned barangay' : `${barangayCount} assigned barangays`}.`
  }
  if (user.roles.includes(ROLES.COLLEGE)) {
    return `Showing beneficiaries assigned to ${user.college?.code ?? 'your college'}, served by it, or referred from or to it.`
  }
  return null
}

export default function BeneficiaryList() {
  const { user, hasRole } = useCurrentUser()
  const canEdit = hasRole(...BENEFICIARY_EDITORS)
  const navigate = useNavigate()
  const location = useLocation()
  const list = useListPage(listBeneficiaries)
  const { data } = list
  const [barangays, setBarangays] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const scope = barangays && scopeNote(user, barangays.length)

  useEffect(() => {
    listBarangays({ assigned: 1 }).then(setBarangays, () => setBarangays([]))
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page__header page-header-actions">
        <div>
          <h1>Beneficiaries</h1>
          <p>Profiles of community members served by MCU colleges and departments.</p>
        </div>
        <div className="page-header-actions__buttons">
          {hasRole(...RECORD_MANAGERS) && (
            <Link to="import" className="btn btn--outline">
              <HiOutlineArrowUpTray aria-hidden="true" /> Import from Excel
            </Link>
          )}
          {canEdit && (
            <Link to="new" className="btn btn--purple">
              <HiOutlineUserPlus aria-hidden="true" /> Add beneficiary
            </Link>
          )}
        </div>
      </div>

      {scope && <p className="scope-note">{scope}</p>}

      <section className="admin-panel data-panel" aria-labelledby="beneficiaries-title">
        <div className="data-panel__top">
          <div>
            <h2 id="beneficiaries-title">Beneficiary records</h2>
            <p className="data-panel__meta">
              {data && `${data.total.toLocaleString()} ${data.total === 1 ? 'record' : 'records'}${list.filtered ? ' found' : ''}`}
            </p>
          </div>
          <div className="data-panel__tools">
            <SearchBox label="Search beneficiaries" placeholder="Name, contact or BEN-ID" value={list.searchInput} onChange={list.setSearchInput} />
            <FilterSelect
              label="Barangay"
              allLabel="All barangays"
              value={list.filters.barangayId}
              onChange={(v) => list.setFilter('barangayId', v)}
              options={(barangays ?? []).map((b) => [b.id, `${b.name}, ${b.city}`])}
            />
            <FilterSelect
              label="Sex"
              allLabel="All sexes"
              value={list.filters.sex}
              onChange={(v) => list.setFilter('sex', v)}
              options={Object.entries(SEX_LABELS)}
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

        {list.loading && <p className="data-empty">Loading beneficiaries…</p>}
        {list.error && <p className="data-empty">Couldn't load beneficiaries. Please refresh the page.</p>}
        {data?.items.length === 0 && (
          <div className="data-empty">
            {list.filtered ? (
              <p>No beneficiaries match your search or filters.</p>
            ) : (
              <>
                <p>No beneficiaries yet.</p>
                {canEdit && (
                  <Link to="new" className="btn btn--outline data-empty__action">
                    <HiOutlineUserPlus aria-hidden="true" /> Add the first beneficiary
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {data?.items.length > 0 && (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Beneficiary</th>
                  <th scope="col">Age / Sex</th>
                  <th scope="col">Barangay</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((b) => (
                  <tr key={b.id} className="is-clickable" onClick={() => navigate(String(b.id))}>
                    <td data-label="Beneficiary">
                      <div className="person-cell">
                        <span className="person-cell__avatar" aria-hidden="true">
                          {initialsOf(b)}
                        </span>
                        <div>
                          <Link to={String(b.id)} onClick={(e) => e.stopPropagation()}>
                            {listName(b)}
                          </Link>
                          <span>{b.code}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Age / Sex">
                      {ageOf(b.birthDate)} · {SEX_LABELS[b.sex]}
                      {b.isPwd && <span className="tag">PWD</span>}
                    </td>
                    <td data-label="Barangay">{b.barangay.name}</td>
                    <td data-label="Contact" className="data-table__muted">
                      {b.contactNumber ?? '—'}
                    </td>
                    <td data-label="Registered" className="data-table__muted">
                      {formatDate(b.createdAt)}
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
