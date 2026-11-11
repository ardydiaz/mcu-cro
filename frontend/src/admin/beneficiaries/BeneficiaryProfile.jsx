import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  HiArrowLeft,
  HiOutlineArrowsRightLeft,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteBeneficiary, getBeneficiary, listReferrals, listServiceRecords } from '../../api/admin.api.js'
import { CIVIL_STATUS_LABELS, EDUCATION_LABELS, SEX_LABELS } from '../../constants/beneficiaries.js'
import { BENEFICIARY_EDITORS, RECORD_MANAGERS, SERVICE_EDITORS } from '../../constants/roles.js'
import { SERVICE_TYPE_LABELS } from '../../constants/services.js'
import Detail from '../shared/Detail.jsx'
import { ageOf, formatDate, formatDateTime, fullName, initialsOf } from '../shared/format.js'
import { ReferralRow } from '../referrals/ReferralList.jsx'
import { FollowUpBadge } from '../service-records/ServiceRecordList.jsx'

// Requirements Step 6: the beneficiary's history of services, newest first —
// program, college, service, date, findings and follow-up.
function ServiceHistory({ beneficiaryId, services, canRecord }) {
  return (
    <section className="form-card" aria-labelledby="p-services">
      <div className="card-head">
        <h2 id="p-services">
          Service history <span className="card-head__count">{services.total}</span>
        </h2>
        {canRecord && (
          <Link to={`/admin/service-records/new?beneficiaryId=${beneficiaryId}`} className="btn btn--outline btn--sm">
            <HiOutlinePlus aria-hidden="true" /> Record service
          </Link>
        )}
      </div>
      {services.items.length === 0 ? (
        <div className="side-empty">
          <span className="admin-empty__icon">
            <HiOutlineClipboardDocumentList aria-hidden="true" />
          </span>
          <p>No services recorded yet.</p>
        </div>
      ) : (
        <ol className="timeline">
          {services.items.map((s) => (
            <li key={s.id}>
              <time dateTime={s.serviceDate}>{formatDate(s.serviceDate)}</time>
              <Link to={`/admin/service-records/${s.id}`} className="timeline__card">
                <span className="timeline__title">
                  <strong>{SERVICE_TYPE_LABELS[s.serviceType]}</strong>
                  <span className="timeline__college" title={s.college.name}>
                    {s.college.code}
                  </span>
                  {s.referralCount > 0 && <span className="tag">Referred</span>}
                </span>
                {s.program && <span className="timeline__program">{s.program.name}</span>}
                {s.findings && <span className="timeline__text">{s.findings}</span>}
                {s.followUpStatus !== 'none' && (
                  <span className="timeline__follow-up">
                    Follow-up: <FollowUpBadge status={s.followUpStatus} date={s.followUpDate} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {services.total > services.items.length && (
        <Link to={`/admin/service-records?search=${encodeURIComponent(`BEN-${String(beneficiaryId).padStart(6, '0')}`)}`} className="card-more">
          See all {services.total} services
        </Link>
      )}
    </section>
  )
}

// /admin/beneficiaries/:id
export default function BeneficiaryProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { hasRole } = useCurrentUser()
  const [loaded, setLoaded] = useState({ id: null })
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const [confirming, setConfirming] = useState(false)
  const [removeError, setRemoveError] = useState('')

  useEffect(() => {
    let current = true
    Promise.all([
      getBeneficiary(id),
      listServiceRecords({ beneficiaryId: id, pageSize: 50 }),
      listReferrals({ beneficiaryId: id, pageSize: 50 }),
    ]).then(
      ([beneficiary, services, referrals]) => current && setLoaded({ id, beneficiary, services, referrals }),
      (error) => current && setLoaded({ id, error }),
    )
    return () => {
      current = false
    }
  }, [id])

  if (loaded.id !== id) return <p className="admin-page data-empty">Loading…</p>
  if (loaded.error) {
    return (
      <div className="admin-page admin-empty">
        <h1>{loaded.error.status === 404 ? 'Beneficiary not found' : "Couldn't load this record"}</h1>
        <p>{loaded.error.status === 404 ? 'It may have been removed.' : 'Please refresh the page.'}</p>
        <Link to="/admin/beneficiaries" className="btn btn--outline">
          Back to beneficiaries
        </Link>
      </div>
    )
  }

  const b = loaded.beneficiary
  const name = fullName(b)

  async function remove() {
    try {
      await deleteBeneficiary(b.id)
      navigate('/admin/beneficiaries', { replace: true, state: { notice: `${name} (${b.code}) was removed.` } })
    } catch (err) {
      setRemoveError(err.message)
    }
  }

  return (
    <div className="admin-page">
      <Link to="/admin/beneficiaries" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Beneficiaries
      </Link>

      <header className="profile-head">
        <span className="profile-head__avatar" aria-hidden="true">
          {initialsOf(b)}
        </span>
        <div className="profile-head__main">
          <h1>{name}</h1>
          <p>
            <span className="code-chip">{b.code}</span>
            <span>
              {ageOf(b.birthDate)} years old · {SEX_LABELS[b.sex]}
            </span>
            {b.isPwd && <span className="tag">PWD</span>}
          </p>
          <ul className="profile-head__facts">
            <li>
              <HiOutlineMapPin aria-hidden="true" /> {b.barangay.name}, {b.barangay.city}
            </li>
            {b.contactNumber && (
              <li>
                <HiOutlinePhone aria-hidden="true" /> <a href={`tel:${b.contactNumber}`}>{b.contactNumber}</a>
              </li>
            )}
          </ul>
        </div>
        <div className="profile-head__actions">
          {hasRole(...BENEFICIARY_EDITORS) && (
            <Link to="edit" className="btn btn--purple">
              <HiOutlinePencilSquare aria-hidden="true" /> Edit
            </Link>
          )}
          {hasRole(...RECORD_MANAGERS) && (
            <button type="button" className="btn btn--outline btn--outline-danger" onClick={() => setConfirming(true)}>
              <HiOutlineTrash aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className="admin-notice admin-notice--success profile-notice" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}

      <div className="profile-grid">
        <div className="profile-grid__main">
          <ServiceHistory beneficiaryId={b.id} services={loaded.services} canRecord={hasRole(...SERVICE_EDITORS)} />

          <section className="form-card" aria-labelledby="p-personal">
            <h2 id="p-personal">Personal information</h2>
            <dl className="detail-grid">
              <Detail label="First name">{b.firstName}</Detail>
              <Detail label="Middle name">{b.middleName}</Detail>
              <Detail label="Last name">{b.lastName}</Detail>
              <Detail label="Suffix">{b.suffix}</Detail>
              <Detail label="Birth date">{formatDate(b.birthDate)}</Detail>
              <Detail label="Sex">{SEX_LABELS[b.sex]}</Detail>
              <Detail label="Civil status">{CIVIL_STATUS_LABELS[b.civilStatus]}</Detail>
            </dl>
          </section>

          <section className="form-card" aria-labelledby="p-address">
            <h2 id="p-address">Address and contact</h2>
            <dl className="detail-grid">
              <Detail label="Barangay">
                {b.barangay.name}, {b.barangay.city}
              </Detail>
              <Detail label="House no., street, purok">{b.address}</Detail>
              <Detail label="Contact number">{b.contactNumber}</Detail>
              <Detail label="Email">{b.email}</Detail>
            </dl>
          </section>

          <section className="form-card" aria-labelledby="p-family">
            <h2 id="p-family">Family and background</h2>
            <dl className="detail-grid">
              <Detail label="Household size">{b.householdSize}</Detail>
              <Detail label="Occupation">{b.occupation}</Detail>
              <Detail label="Highest education">{EDUCATION_LABELS[b.education]}</Detail>
              <Detail label="Person with disability">{b.isPwd ? 'Yes' : 'No'}</Detail>
              <Detail label="Emergency contact">{b.emergencyContactName}</Detail>
              <Detail label="Emergency contact number">{b.emergencyContactNumber}</Detail>
              <Detail label="Notes" wide text>
                {b.notes}
              </Detail>
            </dl>
          </section>
        </div>

        <aside className="profile-grid__side">
          <section className="form-card" aria-labelledby="p-referrals">
            <div className="card-head">
              <h2 id="p-referrals">
                Referrals <span className="card-head__count">{loaded.referrals.total}</span>
              </h2>
              {hasRole(...SERVICE_EDITORS) && (
                <Link to={`/admin/referrals/new?beneficiaryId=${b.id}`} className="btn btn--outline btn--sm" aria-label="New referral">
                  <HiOutlineArrowsRightLeft aria-hidden="true" /> New
                </Link>
              )}
            </div>
            {loaded.referrals.items.length === 0 ? (
              <p className="side-note">No referrals.</p>
            ) : (
              <ul className="mini-list">
                {loaded.referrals.items.map((r) => (
                  <ReferralRow key={r.id} referral={r} />
                ))}
              </ul>
            )}
          </section>

          <section className="form-card" aria-labelledby="p-colleges">
            <h2 id="p-colleges">Assigned colleges</h2>
            {b.colleges?.length > 0 ? (
              <ul className="college-tags">
                {b.colleges.map((c) => (
                  <li key={c.id} title={c.name}>
                    {c.code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="side-note">None assigned.</p>
            )}
          </section>

          <section className="form-card" aria-labelledby="p-record">
            <h2 id="p-record">Record</h2>
            <dl className="detail-grid detail-grid--single">
              <Detail label="Registered">
                {formatDateTime(b.createdAt)}
                {b.createdByName && ` by ${b.createdByName}`}
              </Detail>
              <Detail label="Last updated">
                {formatDateTime(b.updatedAt)}
                {b.updatedByName && ` by ${b.updatedByName}`}
              </Detail>
              <Detail label="Privacy consent recorded">{formatDateTime(b.consentAt)}</Detail>
            </dl>
          </section>
        </aside>
      </div>

      <Modal
        open={confirming}
        size="sm"
        onClose={() => setConfirming(false)}
        title="Remove beneficiary?"
        description={`${name} · ${b.code}`}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={remove}>
              Remove
            </button>
          </>
        }
      >
        <p className="confirm-text">
          The record will no longer appear in lists or searches. It is kept in the database for history and the audit log.
        </p>
        {removeError && (
          <p className="admin-alert" role="alert">
            {removeError}
          </p>
        )}
      </Modal>
    </div>
  )
}
