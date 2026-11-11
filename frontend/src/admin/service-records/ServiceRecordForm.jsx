import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlinePlus } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import {
  createProgram,
  createServiceRecord,
  getBeneficiary,
  getServiceRecord,
  listColleges,
  listPrograms,
  updateServiceRecord,
} from '../../api/admin.api.js'
import { BENEFICIARY_EDITORS } from '../../constants/roles.js'
import { DEFAULT_COLLEGE_FOR_SERVICE, FOLLOW_UP_LABELS, SERVICE_TYPE_LABELS } from '../../constants/services.js'
import BeneficiaryPicker from '../shared/BeneficiaryPicker.jsx'
import { todayIso } from '../shared/format.js'

// /admin/service-records/new (optionally ?beneficiaryId=) and /admin/service-records/:id/edit
export default function ServiceRecordFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const prefillId = params.get('beneficiaryId')
  const [loaded, setLoaded] = useState(null) // { record } | { beneficiary } | { error } | { empty: true }

  useEffect(() => {
    const load = id
      ? getServiceRecord(id).then((record) => ({ record }))
      : prefillId
        ? getBeneficiary(prefillId).then((beneficiary) => ({ beneficiary }))
        : Promise.resolve({ empty: true })
    load.then(setLoaded, (error) => setLoaded(id ? { error } : { empty: true }))
  }, [id, prefillId])

  if (!loaded) return <p className="admin-page data-empty">Loading…</p>
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
  return <ServiceRecordForm key={id ?? 'new'} record={loaded.record} beneficiary={loaded.beneficiary} />
}

function ServiceRecordForm({ record, beneficiary: prefilled }) {
  const editing = Boolean(record)
  const navigate = useNavigate()
  const { user, hasRole } = useCurrentUser()
  const formRef = useRef(null)
  const ownCollege = user.college // College/Department users record for their own college only

  const [beneficiary, setBeneficiary] = useState(prefilled ?? null)
  const [values, setValues] = useState(() => ({
    serviceDate: record?.serviceDate ?? todayIso(),
    serviceType: record?.serviceType ?? '',
    collegeId: String(record?.college.id ?? ownCollege?.id ?? ''),
    programId: record?.program ? String(record.program.id) : '',
    findings: record?.findings ?? '',
    intervention: record?.intervention ?? '',
    recommendation: record?.recommendation ?? '',
    followUpStatus: record?.followUpStatus ?? 'none',
    followUpDate: record?.followUpDate ?? '',
  }))
  const [colleges, setColleges] = useState([])
  const [programs, setPrograms] = useState([])
  const [addingProgram, setAddingProgram] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
    listPrograms().then(setPrograms, () => {})
  }, [])

  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [focusRequest])

  const clearError = (field) => setErrors((errs) => (errs[field] ? { ...errs, [field]: undefined } : errs))
  const set = (field) => (e) => {
    const value = e.target.value
    setValues((v) => {
      const next = { ...v, [field]: value }
      // Picking a type of service pre-selects its usual college (if none chosen yet).
      if (field === 'serviceType' && !v.collegeId) {
        const college = colleges.find((c) => c.code === DEFAULT_COLLEGE_FOR_SERVICE[value])
        if (college) next.collegeId = String(college.id)
      }
      if (field === 'followUpStatus' && value === 'none') next.followUpDate = ''
      return next
    })
    clearError(field)
  }

  const back = editing ? `/admin/service-records/${record.id}` : beneficiary && prefilled ? `/admin/beneficiaries/${beneficiary.id}` : '/admin/service-records'

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    const payload = {
      serviceDate: values.serviceDate,
      serviceType: values.serviceType || undefined,
      collegeId: values.collegeId ? Number(values.collegeId) : undefined,
      programId: values.programId ? Number(values.programId) : null,
      findings: values.findings,
      intervention: values.intervention,
      recommendation: values.recommendation,
      followUpStatus: values.followUpStatus,
      followUpDate: values.followUpDate || null,
    }
    try {
      const saved = editing
        ? await updateServiceRecord(record.id, payload)
        : await createServiceRecord({ ...payload, beneficiaryId: beneficiary?.id })
      navigate(`/admin/service-records/${saved.id}`, {
        state: { notice: editing ? 'Changes saved.' : `Service recorded as ${saved.code}.` },
      })
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])))
      setFormError(err.details?.length ? 'Please check the highlighted fields.' : err.message)
      setFocusRequest((n) => n + 1)
    } finally {
      setSaving(false)
    }
  }

  const textArea = (name, label, hint) => (
    <label className="admin-field form-grid__wide">
      <span>
        {label} <em>{hint ?? '(optional)'}</em>
      </span>
      <textarea value={values[name]} onChange={set(name)} rows={3} maxLength={5000} aria-invalid={Boolean(errors[name])} />
      {errors[name] && <small className="admin-field__error">{errors[name]}</small>}
    </label>
  )

  return (
    <div className="admin-page">
      <Link to={back} className="back-link">
        <HiArrowLeft aria-hidden="true" /> {editing ? 'Back to service record' : 'Back'}
      </Link>
      <div className="admin-page__header">
        <h1>{editing ? `Edit ${record.code}` : 'Record a service'}</h1>
        <p>{editing ? 'Changes are recorded in the audit log.' : 'Encode a service from the assessment or service/intervention form.'}</p>
      </div>

      <form ref={formRef} className="beneficiary-form" onSubmit={onSubmit} noValidate>
        <section className="form-card" aria-labelledby="sr-beneficiary">
          <h2 id="sr-beneficiary">Beneficiary</h2>
          {editing ? (
            <div className="picked-person">
              <div>
                <strong>{record.beneficiary.name}</strong>
                <span>{record.beneficiary.code}</span>
              </div>
            </div>
          ) : (
            <BeneficiaryPicker
              value={beneficiary}
              onChange={(b) => {
                setBeneficiary(b)
                clearError('beneficiaryId')
              }}
              error={errors.beneficiaryId}
              autoFocus={!beneficiary}
            />
          )}
          {errors.beneficiaryId && <small className="admin-field__error">{errors.beneficiaryId}</small>}
        </section>

        <section className="form-card" aria-labelledby="sr-service">
          <h2 id="sr-service">Service</h2>
          <div className="form-grid">
            <label className="admin-field">
              <span>Date of service</span>
              <input type="date" value={values.serviceDate} max={todayIso()} onChange={set('serviceDate')} required aria-invalid={Boolean(errors.serviceDate)} />
              {errors.serviceDate && <small className="admin-field__error">{errors.serviceDate}</small>}
            </label>

            <label className="admin-field">
              <span>Type of service</span>
              <select value={values.serviceType} onChange={set('serviceType')} required aria-invalid={Boolean(errors.serviceType)}>
                <option value="" disabled>
                  Choose…
                </option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.serviceType && <small className="admin-field__error">{errors.serviceType}</small>}
            </label>

            <label className="admin-field">
              <span>Responsible college or department</span>
              <select
                value={values.collegeId}
                onChange={set('collegeId')}
                disabled={Boolean(ownCollege)}
                required
                aria-invalid={Boolean(errors.collegeId)}
              >
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

            <div className="admin-field">
              <label htmlFor="sr-program" className="admin-field__label">
                Program <em>(optional)</em>
              </label>
              <div className="field-with-action">
                <select id="sr-program" value={values.programId} onChange={set('programId')} aria-invalid={Boolean(errors.programId)}>
                  <option value="">No specific program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {hasRole(...BENEFICIARY_EDITORS) && (
                  <button type="button" className="btn btn--outline" onClick={() => setAddingProgram(true)} aria-label="Add program">
                    <HiOutlinePlus aria-hidden="true" />
                  </button>
                )}
              </div>
              {errors.programId && <small className="admin-field__error">{errors.programId}</small>}
            </div>
          </div>
        </section>

        <section className="form-card" aria-labelledby="sr-findings">
          <h2 id="sr-findings">Assessment and intervention</h2>
          <div className="form-grid">
            {textArea('findings', 'Assessment / findings')}
            {textArea('intervention', 'Intervention / service provided')}
            {textArea('recommendation', 'Recommendation')}
          </div>
        </section>

        <section className="form-card" aria-labelledby="sr-follow-up">
          <h2 id="sr-follow-up">Follow-up</h2>
          <div className="form-grid">
            <label className="admin-field">
              <span>Follow-up status</span>
              <select value={values.followUpStatus} onChange={set('followUpStatus')} aria-invalid={Boolean(errors.followUpStatus)}>
                {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {values.followUpStatus !== 'none' && (
              <label className="admin-field">
                <span>Follow-up date</span>
                <input type="date" value={values.followUpDate} onChange={set('followUpDate')} aria-invalid={Boolean(errors.followUpDate)} />
                {errors.followUpDate && <small className="admin-field__error">{errors.followUpDate}</small>}
              </label>
            )}
          </div>
          {!editing && <p className="admin-field__hint form-hint">Needs a referral? Save the service first, then choose “Create referral”.</p>}
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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save service record'}
          </button>
        </div>
      </form>

      {addingProgram && (
        <AddProgramModal
          onClose={() => setAddingProgram(false)}
          onAdded={(program) => {
            setPrograms((list) => [...list, program].sort((a, b) => a.name.localeCompare(b.name)))
            setValues((v) => ({ ...v, programId: String(program.id) }))
            setAddingProgram(false)
          }}
        />
      )}
    </div>
  )
}

function AddProgramModal({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      onAdded(await createProgram({ name }))
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Add program"
      description="Community programs appear in the list for every user."
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="program-form" className="btn btn--purple" disabled={saving}>
            {saving ? 'Adding…' : 'Add program'}
          </button>
        </>
      }
    >
      <form id="program-form" className="admin-form" onSubmit={onSubmit} noValidate>
        <label className="admin-field">
          <span>Program name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Diabetes Monitoring" maxLength={160} autoFocus aria-invalid={Boolean(error)} />
          {error && <small className="admin-field__error">{error}</small>}
        </label>
      </form>
    </Modal>
  )
}
