import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import {
  createReferral,
  getBeneficiary,
  getReferral,
  listColleges,
  listServiceRecords,
  updateReferral,
} from '../../api/admin.api.js'
import { REFERRAL_STATUS_LABELS, SERVICE_TYPE_LABELS, URGENCY_LABELS } from '../../constants/services.js'
import BeneficiaryPicker from '../shared/BeneficiaryPicker.jsx'
import { formatDate, todayIso } from '../shared/format.js'

// /admin/referrals/new (optionally ?beneficiaryId=&serviceRecordId=) and /admin/referrals/:id/edit
export default function ReferralFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const prefillId = params.get('beneficiaryId')
  const [loaded, setLoaded] = useState(null)

  useEffect(() => {
    const load = id
      ? getReferral(id).then((referral) => ({ referral }))
      : prefillId
        ? getBeneficiary(prefillId).then((beneficiary) => ({ beneficiary }))
        : Promise.resolve({})
    load.then(setLoaded, (error) => setLoaded(id ? { error } : {}))
  }, [id, prefillId])

  if (!loaded) return <p className="admin-page data-empty">Loading…</p>
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
  return (
    <ReferralForm
      key={id ?? 'new'}
      referral={loaded.referral}
      beneficiary={loaded.beneficiary}
      serviceRecordId={params.get('serviceRecordId') ?? ''}
    />
  )
}

function ReferralForm({ referral, beneficiary: prefilled, serviceRecordId }) {
  const editing = Boolean(referral)
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const formRef = useRef(null)
  const ownCollege = user.college

  const [beneficiary, setBeneficiary] = useState(prefilled ?? null)
  const beneficiaryId = editing ? referral.beneficiary.id : beneficiary?.id
  const [values, setValues] = useState(() => ({
    serviceRecordId: String(referral?.serviceRecord?.id ?? serviceRecordId ?? ''),
    referralDate: referral?.referralDate ?? todayIso(),
    collegeId: String(referral?.college.id ?? ownCollege?.id ?? ''),
    destination: referral?.referredToFacility ? 'facility' : 'college',
    referredToCollegeId: String(referral?.referredToCollege?.id ?? ''),
    referredToFacility: referral?.referredToFacility ?? '',
    reason: referral?.reason ?? '',
    urgency: referral?.urgency ?? 'routine',
    status: referral?.status ?? 'pending',
    outcome: referral?.outcome ?? '',
  }))
  const [colleges, setColleges] = useState([])
  const [services, setServices] = useState({ beneficiaryId: null, items: [] })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
  }, [])

  // The chosen beneficiary's services, to link the referral to one.
  useEffect(() => {
    if (!beneficiaryId) return
    listServiceRecords({ beneficiaryId, pageSize: 50 }).then(
      (data) => setServices({ beneficiaryId, items: data.items }),
      () => setServices({ beneficiaryId, items: [] }),
    )
  }, [beneficiaryId])

  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [focusRequest])

  const clearError = (field) => setErrors((errs) => (errs[field] ? { ...errs, [field]: undefined } : errs))
  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    clearError(field === 'referredToCollegeId' || field === 'referredToFacility' || field === 'destination' ? 'referredTo' : field)
  }
  const serviceOptions = services.beneficiaryId === beneficiaryId ? services.items : []

  // Picking the service fills in the referring college and the reason.
  function onServiceChange(e) {
    const service = serviceOptions.find((s) => String(s.id) === e.target.value)
    setValues((v) => ({
      ...v,
      serviceRecordId: e.target.value,
      collegeId: ownCollege ? v.collegeId : service ? String(service.college.id) : v.collegeId,
      reason: v.reason || service?.recommendation || '',
    }))
  }

  const back = editing ? `/admin/referrals/${referral.id}` : '/admin/referrals'

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    const toCollege = values.destination === 'college'
    const payload = {
      serviceRecordId: values.serviceRecordId ? Number(values.serviceRecordId) : null,
      referralDate: values.referralDate,
      collegeId: values.collegeId ? Number(values.collegeId) : undefined,
      referredToCollegeId: toCollege && values.referredToCollegeId ? Number(values.referredToCollegeId) : null,
      referredToFacility: toCollege ? null : values.referredToFacility,
      reason: values.reason,
      urgency: values.urgency,
      status: values.status,
      outcome: values.outcome,
    }
    try {
      const saved = editing ? await updateReferral(referral.id, payload) : await createReferral({ ...payload, beneficiaryId })
      navigate(`/admin/referrals/${saved.id}`, { state: { notice: editing ? 'Changes saved.' : `Referral saved as ${saved.code}.` } })
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])))
      setFormError(err.details?.length ? 'Please check the highlighted fields.' : err.message)
      setFocusRequest((n) => n + 1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <Link to={back} className="back-link">
        <HiArrowLeft aria-hidden="true" /> {editing ? 'Back to referral' : 'Referrals'}
      </Link>
      <div className="admin-page__header">
        <h1>{editing ? `Edit ${referral.code}` : 'New referral'}</h1>
        <p>{editing ? 'Changes are recorded in the audit log.' : 'Encode the details from the Referral Form.'}</p>
      </div>

      <form ref={formRef} className="beneficiary-form" onSubmit={onSubmit} noValidate>
        <section className="form-card" aria-labelledby="rf-beneficiary">
          <h2 id="rf-beneficiary">Beneficiary</h2>
          {editing ? (
            <div className="picked-person">
              <div>
                <strong>{referral.beneficiary.name}</strong>
                <span>{referral.beneficiary.code}</span>
              </div>
            </div>
          ) : (
            <BeneficiaryPicker
              value={beneficiary}
              onChange={(b) => {
                setBeneficiary(b)
                setValues((v) => ({ ...v, serviceRecordId: '' }))
                clearError('beneficiaryId')
              }}
              error={errors.beneficiaryId}
              autoFocus={!beneficiary}
            />
          )}
          {errors.beneficiaryId && <small className="admin-field__error">{errors.beneficiaryId}</small>}

          {beneficiaryId && (
            <label className="admin-field form-gap">
              <span>
                From service record <em>(optional)</em>
              </span>
              <select value={values.serviceRecordId} onChange={onServiceChange} aria-invalid={Boolean(errors.serviceRecordId)}>
                <option value="">Not linked to a service</option>
                {serviceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.serviceDate)} · {SERVICE_TYPE_LABELS[s.serviceType]} · {s.college.code} ({s.code})
                  </option>
                ))}
              </select>
              {errors.serviceRecordId && <small className="admin-field__error">{errors.serviceRecordId}</small>}
            </label>
          )}
        </section>

        <section className="form-card" aria-labelledby="rf-referral">
          <h2 id="rf-referral">Referral</h2>
          <div className="form-grid">
            <label className="admin-field">
              <span>Referral date</span>
              <input type="date" value={values.referralDate} max={todayIso()} onChange={set('referralDate')} aria-invalid={Boolean(errors.referralDate)} />
              {errors.referralDate && <small className="admin-field__error">{errors.referralDate}</small>}
            </label>

            <label className="admin-field">
              <span>Referring college or department</span>
              <select value={values.collegeId} onChange={set('collegeId')} disabled={Boolean(ownCollege)} aria-invalid={Boolean(errors.collegeId)}>
                <option value="" disabled>
                  Choose…
                </option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.collegeId && <small className="admin-field__error">{errors.collegeId}</small>}
            </label>

            <fieldset className="admin-field form-grid__wide">
              <legend>Referred to</legend>
              <div className="segmented segmented--auto" aria-invalid={Boolean(errors.referredTo)}>
                {[
                  ['college', 'An MCU college/department'],
                  ['facility', 'An outside facility'],
                ].map(([value, label]) => (
                  <label key={value} className={values.destination === value ? 'is-selected' : ''}>
                    <input type="radio" name="destination" value={value} checked={values.destination === value} onChange={set('destination')} />
                    {label}
                  </label>
                ))}
              </div>
              {values.destination === 'college' ? (
                <select
                  aria-label="College or department referred to"
                  value={values.referredToCollegeId}
                  onChange={set('referredToCollegeId')}
                  aria-invalid={Boolean(errors.referredTo)}
                >
                  <option value="" disabled>
                    Choose the college or department…
                  </option>
                  {colleges
                    .filter((c) => String(c.id) !== values.collegeId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  aria-label="Facility referred to"
                  value={values.referredToFacility}
                  onChange={set('referredToFacility')}
                  placeholder="Hospital, clinic or health center"
                  maxLength={160}
                  aria-invalid={Boolean(errors.referredTo)}
                />
              )}
              {errors.referredTo && <small className="admin-field__error">{errors.referredTo}</small>}
            </fieldset>

            <label className="admin-field form-grid__wide">
              <span>Reason for referral</span>
              <textarea value={values.reason} onChange={set('reason')} rows={3} maxLength={5000} aria-invalid={Boolean(errors.reason)} />
              {errors.reason && <small className="admin-field__error">{errors.reason}</small>}
            </label>

            <fieldset className="admin-field">
              <legend>Urgency</legend>
              <div className="segmented">
                {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                  <label key={value} className={values.urgency === value ? 'is-selected' : ''}>
                    <input type="radio" name="urgency" value={value} checked={values.urgency === value} onChange={set('urgency')} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="admin-field">
              <span>Status</span>
              <select value={values.status} onChange={set('status')}>
                {Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {(editing || values.status === 'completed' || values.status === 'cancelled') && (
              <label className="admin-field form-grid__wide">
                <span>
                  Outcome <em>(optional)</em>
                </span>
                <textarea value={values.outcome} onChange={set('outcome')} rows={3} maxLength={5000} placeholder="What happened after the referral?" />
              </label>
            )}
          </div>
        </section>

        <div className="form-actions">
          {formError && (
            <p className="admin-alert" role="alert">
              {formError}
            </p>
          )}
          <Link to={back} className="btn btn--outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn--purple" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save referral'}
          </button>
        </div>
      </form>
    </div>
  )
}
