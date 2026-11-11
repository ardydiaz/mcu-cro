import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineArrowsRightLeft, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteServiceRecord, getServiceRecord, listReferrals } from '../../api/admin.api.js'
import { RECORD_MANAGERS, SERVICE_EDITORS } from '../../constants/roles.js'
import { SERVICE_TYPE_LABELS } from '../../constants/services.js'
import Detail from '../shared/Detail.jsx'
import { formatDate, formatDateTime } from '../shared/format.js'
import { ReferralRow } from '../referrals/ReferralList.jsx'
import { FollowUpBadge } from './ServiceRecordList.jsx'

// /admin/service-records/:id
export default function ServiceRecordDetail() {
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
    Promise.all([getServiceRecord(id), listReferrals({ serviceRecordId: id, pageSize: 50 })]).then(
      ([record, referrals]) => current && setLoaded({ id, record, referrals: referrals.items }),
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
        <h1>{loaded.error.status === 404 ? 'Service record not found' : "Couldn't load this record"}</h1>
        <Link to="/admin/service-records" className="btn btn--outline">
          Back to service records
        </Link>
      </div>
    )
  }

  const { record: s, referrals } = loaded
  const canEdit = hasRole(...SERVICE_EDITORS)

  async function remove() {
    try {
      await deleteServiceRecord(s.id)
      navigate('/admin/service-records', { replace: true, state: { notice: `${s.code} was removed.` } })
    } catch (err) {
      setRemoveError(err.message)
    }
  }

  return (
    <div className="admin-page">
      <Link to="/admin/service-records" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Service records
      </Link>

      <header className="profile-head">
        <div className="profile-head__main">
          <h1>{SERVICE_TYPE_LABELS[s.serviceType]} service</h1>
          <p>
            <span className="code-chip">{s.code}</span>
            <span>{formatDate(s.serviceDate)}</span>
            <span>· {s.college.name}</span>
          </p>
          <ul className="profile-head__facts">
            <li>
              Beneficiary:&nbsp;<Link to={`/admin/beneficiaries/${s.beneficiary.id}`}>{s.beneficiary.name}</Link>&nbsp;({s.beneficiary.code})
            </li>
          </ul>
        </div>
        <div className="profile-head__actions">
          {canEdit && (
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
          <section className="form-card" aria-labelledby="s-service">
            <h2 id="s-service">Service</h2>
            <dl className="detail-grid">
              <Detail label="Date of service">{formatDate(s.serviceDate)}</Detail>
              <Detail label="Type of service">{SERVICE_TYPE_LABELS[s.serviceType]}</Detail>
              <Detail label="Responsible college/department">{s.college.name}</Detail>
              <Detail label="Program">{s.program?.name}</Detail>
            </dl>
          </section>

          <section className="form-card" aria-labelledby="s-findings">
            <h2 id="s-findings">Assessment and intervention</h2>
            <dl className="detail-grid">
              <Detail label="Assessment / findings" wide text>
                {s.findings}
              </Detail>
              <Detail label="Intervention / service provided" wide text>
                {s.intervention}
              </Detail>
              <Detail label="Recommendation" wide text>
                {s.recommendation}
              </Detail>
              <Detail label="Follow-up">
                <FollowUpBadge status={s.followUpStatus} date={s.followUpDate} />
              </Detail>
            </dl>
          </section>
        </div>

        <aside className="profile-grid__side">
          <section className="form-card" aria-labelledby="s-referrals">
            <div className="card-head">
              <h2 id="s-referrals">Referrals</h2>
              {canEdit && (
                <Link
                  to={`/admin/referrals/new?beneficiaryId=${s.beneficiary.id}&serviceRecordId=${s.id}`}
                  className="btn btn--outline btn--sm"
                >
                  <HiOutlineArrowsRightLeft aria-hidden="true" /> Create referral
                </Link>
              )}
            </div>
            {referrals.length === 0 ? (
              <p className="side-note">No referrals from this service.</p>
            ) : (
              <ul className="mini-list">
                {referrals.map((r) => (
                  <ReferralRow key={r.id} referral={r} />
                ))}
              </ul>
            )}
          </section>

          <section className="form-card" aria-labelledby="s-record">
            <h2 id="s-record">Record</h2>
            <dl className="detail-grid detail-grid--single">
              <Detail label="Recorded">
                {formatDateTime(s.createdAt)}
                {s.createdByName && ` by ${s.createdByName}`}
              </Detail>
              <Detail label="Last updated">
                {formatDateTime(s.updatedAt)}
                {s.updatedByName && ` by ${s.updatedByName}`}
              </Detail>
            </dl>
          </section>
        </aside>
      </div>

      <Modal
        open={confirming}
        size="sm"
        onClose={() => setConfirming(false)}
        title="Remove service record?"
        description={`${s.code} · ${s.beneficiary.name}`}
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
        <p className="confirm-text">The record will no longer appear in lists, reports or the beneficiary's history. It is kept for the audit log.</p>
        {removeError && (
          <p className="admin-alert" role="alert">
            {removeError}
          </p>
        )}
      </Modal>
    </div>
  )
}
