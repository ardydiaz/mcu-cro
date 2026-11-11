import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineArrowPath, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteReferral, getReferral, updateReferral } from '../../api/admin.api.js'
import { RECORD_MANAGERS, SERVICE_EDITORS } from '../../constants/roles.js'
import { REFERRAL_STATUS_LABELS, SERVICE_TYPE_LABELS, URGENCY_LABELS } from '../../constants/services.js'
import Detail from '../shared/Detail.jsx'
import { destinationOf, formatDate, formatDateTime } from '../shared/format.js'
import { StatusPill, UrgencyPill } from './ReferralList.jsx'

// /admin/referrals/:id
export default function ReferralDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { hasRole } = useCurrentUser()
  const [loaded, setLoaded] = useState({ id: null })
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const [dialog, setDialog] = useState(null) // 'status' | 'remove'

  useEffect(() => {
    let current = true
    getReferral(id).then(
      (referral) => current && setLoaded({ id, referral }),
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
        <h1>{loaded.error.status === 404 ? 'Referral not found' : "Couldn't load this referral"}</h1>
        <Link to="/admin/referrals" className="btn btn--outline">
          Back to referrals
        </Link>
      </div>
    )
  }

  const r = loaded.referral
  const canEdit = hasRole(...SERVICE_EDITORS)

  return (
    <div className="admin-page">
      <Link to="/admin/referrals" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Referrals
      </Link>

      <header className="profile-head">
        <div className="profile-head__main">
          <h1>Referral to {destinationOf(r)}</h1>
          <p>
            <span className="code-chip">{r.code}</span>
            <StatusPill status={r.status} />
            <UrgencyPill urgency={r.urgency} />
            <span>· {formatDate(r.referralDate)}</span>
          </p>
          <ul className="profile-head__facts">
            <li>
              Beneficiary:&nbsp;<Link to={`/admin/beneficiaries/${r.beneficiary.id}`}>{r.beneficiary.name}</Link>&nbsp;({r.beneficiary.code})
            </li>
          </ul>
        </div>
        <div className="profile-head__actions">
          {canEdit && (
            <>
              <button type="button" className="btn btn--purple" onClick={() => setDialog('status')}>
                <HiOutlineArrowPath aria-hidden="true" /> Update status
              </button>
              <Link to="edit" className="btn btn--outline">
                <HiOutlinePencilSquare aria-hidden="true" /> Edit
              </Link>
            </>
          )}
          {hasRole(...RECORD_MANAGERS) && (
            <button type="button" className="btn btn--outline btn--outline-danger" onClick={() => setDialog('remove')} aria-label="Remove referral">
              <HiOutlineTrash aria-hidden="true" />
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
          <section className="form-card" aria-labelledby="r-referral">
            <h2 id="r-referral">Referral</h2>
            <dl className="detail-grid">
              <Detail label="Referral date">{formatDate(r.referralDate)}</Detail>
              <Detail label="Referring college/department">{r.college.name}</Detail>
              <Detail label="Referred to">
                {destinationOf(r)}
                <span className="cell-sub">{r.referredToCollege ? 'MCU college/department' : 'Outside facility'}</span>
              </Detail>
              <Detail label="Urgency">{URGENCY_LABELS[r.urgency]}</Detail>
              <Detail label="Reason for referral" wide text>
                {r.reason}
              </Detail>
            </dl>
          </section>

          <section className="form-card" aria-labelledby="r-outcome">
            <h2 id="r-outcome">Status and outcome</h2>
            <dl className="detail-grid">
              <Detail label="Status">{REFERRAL_STATUS_LABELS[r.status]}</Detail>
              <Detail label="Status last changed">{formatDateTime(r.updatedAt)}</Detail>
              <Detail label="Outcome" wide text>
                {r.outcome}
              </Detail>
            </dl>
          </section>
        </div>

        <aside className="profile-grid__side">
          <section className="form-card" aria-labelledby="r-service">
            <h2 id="r-service">From service</h2>
            {r.serviceRecord ? (
              <ul className="mini-list">
                <li>
                  <Link to={`/admin/service-records/${r.serviceRecord.id}`}>
                    <span className="mini-list__main">
                      <strong>{SERVICE_TYPE_LABELS[r.serviceRecord.serviceType]}</strong>
                      <small>
                        {formatDate(r.serviceRecord.serviceDate)} · {r.serviceRecord.code}
                      </small>
                    </span>
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="side-note">Not linked to a service record.</p>
            )}
          </section>

          <section className="form-card" aria-labelledby="r-record">
            <h2 id="r-record">Record</h2>
            <dl className="detail-grid detail-grid--single">
              <Detail label="Created">
                {formatDateTime(r.createdAt)}
                {r.createdByName && ` by ${r.createdByName}`}
              </Detail>
              <Detail label="Last updated">
                {formatDateTime(r.updatedAt)}
                {r.updatedByName && ` by ${r.updatedByName}`}
              </Detail>
            </dl>
          </section>
        </aside>
      </div>

      {dialog === 'status' && (
        <StatusModal
          referral={r}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            setLoaded({ id, referral: saved })
            setNotice(`Status changed to ${REFERRAL_STATUS_LABELS[saved.status].toLowerCase()}.`)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'remove' && (
        <RemoveModal referral={r} onClose={() => setDialog(null)} onRemoved={() => navigate('/admin/referrals', { replace: true, state: { notice: `${r.code} was removed.` } })} />
      )}
    </div>
  )
}

function StatusModal({ referral, onClose, onSaved }) {
  const [status, setStatus] = useState(referral.status)
  const [outcome, setOutcome] = useState(referral.outcome ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      onSaved(await updateReferral(referral.id, { status, outcome }))
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Update referral status"
      description={`${referral.code} · ${referral.beneficiary.name}`}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="status-form" className="btn btn--purple" disabled={saving}>
            {saving ? 'Saving…' : 'Save status'}
          </button>
        </>
      }
    >
      <form id="status-form" className="admin-form" onSubmit={onSubmit} noValidate>
        <fieldset className="admin-field">
          <legend>Status</legend>
          <div className="segmented segmented--wrap">
            {Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => (
              <label key={value} className={status === value ? 'is-selected' : ''}>
                <input type="radio" name="status" value={value} checked={status === value} onChange={(e) => setStatus(e.target.value)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="admin-field">
          <span>
            Outcome <em>(optional)</em>
          </span>
          <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={4} maxLength={5000} placeholder="What happened after the referral?" />
        </label>
        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function RemoveModal({ referral, onClose, onRemoved }) {
  const [error, setError] = useState('')
  async function remove() {
    try {
      await deleteReferral(referral.id)
      onRemoved()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Remove referral?"
      description={`${referral.code} · ${referral.beneficiary.name}`}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={remove}>
            Remove
          </button>
        </>
      }
    >
      <p className="confirm-text">The referral will no longer appear in lists or reports. It is kept for the audit log.</p>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}
