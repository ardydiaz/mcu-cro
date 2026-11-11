import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlinePlus, HiOutlineShieldCheck } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import {
  createBarangay,
  createBeneficiary,
  getBeneficiary,
  listBarangays,
  listColleges,
  updateBeneficiary,
} from '../../api/admin.api.js'
import { CIVIL_STATUS_LABELS, EDUCATION_LABELS, SEX_LABELS } from '../../constants/beneficiaries.js'
import { RECORD_MANAGERS } from '../../constants/roles.js'
import { ageOf, fullName } from '../shared/format.js'

const EMPTY = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthDate: '',
  sex: '',
  civilStatus: '',
  barangayId: '',
  address: '',
  contactNumber: '',
  email: '',
  householdSize: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  occupation: '',
  education: '',
  isPwd: false,
  notes: '',
  collegeIds: [],
}

// API record → form values (strings for inputs).
const toValues = (b) =>
  Object.fromEntries(
    Object.keys(EMPTY).map((key) => {
      if (key === 'barangayId') return [key, String(b.barangay.id)]
      if (key === 'isPwd') return [key, b.isPwd]
      if (key === 'collegeIds') return [key, (b.colleges ?? []).map((c) => c.id)]
      return [key, b[key] == null ? '' : String(b[key])]
    }),
  )

// Form values → API payload. Empty text is sent as '' (the API stores null).
const toPayload = (v) => ({
  ...v,
  barangayId: v.barangayId ? Number(v.barangayId) : undefined,
  householdSize: v.householdSize === '' ? null : Number(v.householdSize),
  civilStatus: v.civilStatus || null,
  education: v.education || null,
  sex: v.sex || undefined,
})

// /admin/beneficiaries/new and /admin/beneficiaries/:id/edit
export default function BeneficiaryFormPage() {
  const { id } = useParams()
  const [loaded, setLoaded] = useState(null) // { beneficiary } or { error }

  useEffect(() => {
    if (!id) return
    getBeneficiary(id).then(
      (beneficiary) => setLoaded({ beneficiary }),
      (error) => setLoaded({ error }),
    )
  }, [id])

  if (!id) return <BeneficiaryForm key="new" />
  if (!loaded) return <p className="admin-page data-empty">Loading…</p>
  if (loaded.error) {
    return (
      <div className="admin-page admin-empty">
        <h1>{loaded.error.status === 404 ? 'Beneficiary not found' : "Couldn't load this record"}</h1>
        <Link to="/admin/beneficiaries" className="btn btn--outline">
          Back to beneficiaries
        </Link>
      </div>
    )
  }
  return <BeneficiaryForm key={id} beneficiary={loaded.beneficiary} />
}

function BeneficiaryForm({ beneficiary }) {
  const editing = Boolean(beneficiary)
  const navigate = useNavigate()
  const { hasRole } = useCurrentUser()
  const formRef = useRef(null)
  const [values, setValues] = useState(() => (editing ? toValues(beneficiary) : EMPTY))
  const [consent, setConsent] = useState(false)
  const [barangays, setBarangays] = useState([])
  const [colleges, setColleges] = useState([])
  const [addingBarangay, setAddingBarangay] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Coordinators get only their assigned barangays.
    listBarangays({ assigned: 1 }).then(
      (list) => {
        // Keep the current barangay selectable when editing.
        const current = beneficiary?.barangay
        setBarangays(current && !list.some((b) => b.id === current.id) ? [...list, current] : list)
      },
      () => setFormError("Couldn't load the list of barangays. Please refresh the page."),
    )
    listColleges().then(setColleges, () => {})
  }, [beneficiary])

  const toggleCollege = (id) => {
    setValues((v) => ({ ...v, collegeIds: v.collegeIds.includes(id) ? v.collegeIds.filter((c) => c !== id) : [...v.collegeIds, id] }))
    clearError('collegeIds')
  }

  // After a failed save, move focus to the first field with an error.
  const [focusRequest, setFocusRequest] = useState(0)
  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [focusRequest])

  // Editing a field clears its error message.
  const clearError = (field) => setErrors((errs) => (errs[field] ? { ...errs, [field]: undefined } : errs))
  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    clearError(field)
  }
  const age = ageOf(values.birthDate)
  const back = editing ? `/admin/beneficiaries/${beneficiary.id}` : '/admin/beneficiaries'

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      const saved = editing
        ? await updateBeneficiary(beneficiary.id, toPayload(values))
        : await createBeneficiary({ ...toPayload(values), consent })
      navigate(`/admin/beneficiaries/${saved.id}`, {
        state: { notice: editing ? 'Changes saved.' : `${fullName(saved)} was registered as ${saved.code}.` },
      })
    } catch (err) {
      const fieldErrors = Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message]))
      setErrors(fieldErrors)
      setFormError(err.details?.length ? 'Please check the highlighted fields.' : err.message)
      setFocusRequest((n) => n + 1)
    } finally {
      setSaving(false)
    }
  }

  function onBarangayAdded(barangay) {
    setBarangays((list) => [...list, barangay].sort((a, b) => a.name.localeCompare(b.name)))
    setValues((v) => ({ ...v, barangayId: String(barangay.id) }))
    setAddingBarangay(false)
  }

  // Shorthand for a text field.
  const field = (name, label, props = {}) => (
    <label className={`admin-field${props.wide ? ' form-grid__wide' : ''}`}>
      <span>
        {label}
        {props.optional && <em> (optional)</em>}
      </span>
      <input
        value={values[name]}
        onChange={set(name)}
        aria-invalid={Boolean(errors[name])}
        {...Object.fromEntries(Object.entries(props).filter(([k]) => !['wide', 'optional'].includes(k)))}
      />
      {errors[name] && <small className="admin-field__error">{errors[name]}</small>}
    </label>
  )

  return (
    <div className="admin-page">
      <Link to={back} className="back-link">
        <HiArrowLeft aria-hidden="true" /> {editing ? 'Back to profile' : 'Beneficiaries'}
      </Link>
      <div className="admin-page__header">
        <h1>{editing ? `Edit ${fullName(beneficiary)}` : 'Add beneficiary'}</h1>
        <p>
          {editing
            ? `${beneficiary.code} · Changes are recorded in the audit log.`
            : 'Encode the details from the Beneficiary Registration/Profile Form.'}
        </p>
      </div>

      <form ref={formRef} className="beneficiary-form" onSubmit={onSubmit} noValidate>
        <section className="form-card" aria-labelledby="personal-title">
          <h2 id="personal-title">Personal information</h2>
          <div className="form-grid">
            {field('firstName', 'First name', { required: true, maxLength: 80, autoComplete: 'off', autoFocus: !editing })}
            {field('middleName', 'Middle name', { optional: true, maxLength: 80, autoComplete: 'off' })}
            {field('lastName', 'Last name', { required: true, maxLength: 80, autoComplete: 'off' })}
            {field('suffix', 'Suffix', { optional: true, maxLength: 10, placeholder: 'Jr., Sr., III', autoComplete: 'off' })}

            <label className="admin-field">
              <span>
                Birth date {age !== null && <em>· {age} years old</em>}
              </span>
              <input type="date" value={values.birthDate} onChange={set('birthDate')} required aria-invalid={Boolean(errors.birthDate)} />
              {errors.birthDate && <small className="admin-field__error">{errors.birthDate}</small>}
            </label>

            <fieldset className="admin-field">
              <legend>Sex</legend>
              <div className="segmented" aria-invalid={Boolean(errors.sex)}>
                {Object.entries(SEX_LABELS).map(([value, label]) => (
                  <label key={value} className={values.sex === value ? 'is-selected' : ''}>
                    <input type="radio" name="sex" value={value} checked={values.sex === value} onChange={set('sex')} />
                    {label}
                  </label>
                ))}
              </div>
              {errors.sex && <small className="admin-field__error">{errors.sex}</small>}
            </fieldset>

            <label className="admin-field">
              <span>
                Civil status <em>(optional)</em>
              </span>
              <select value={values.civilStatus} onChange={set('civilStatus')} aria-invalid={Boolean(errors.civilStatus)}>
                <option value="">—</option>
                {Object.entries(CIVIL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="form-card" aria-labelledby="address-title">
          <h2 id="address-title">Address and contact</h2>
          <div className="form-grid">
            <div className="admin-field form-grid__wide">
              <label htmlFor="barangay" className="admin-field__label">
                Barangay
              </label>
              <div className="field-with-action">
                <select id="barangay" value={values.barangayId} onChange={set('barangayId')} required aria-invalid={Boolean(errors.barangayId)}>
                  <option value="" disabled>
                    {barangays.length ? 'Choose the barangay…' : 'No barangays available'}
                  </option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}, {b.city}
                    </option>
                  ))}
                </select>
                {hasRole(...RECORD_MANAGERS) && (
                  <button type="button" className="btn btn--outline" onClick={() => setAddingBarangay(true)}>
                    <HiOutlinePlus aria-hidden="true" /> Add barangay
                  </button>
                )}
              </div>
              {errors.barangayId && <small className="admin-field__error">{errors.barangayId}</small>}
            </div>
            {field('address', 'House no., street, purok', { optional: true, wide: true, maxLength: 255, autoComplete: 'off' })}
            {field('contactNumber', 'Contact number', { optional: true, type: 'tel', placeholder: '09XX XXX XXXX', autoComplete: 'off' })}
            {field('email', 'Email', { optional: true, type: 'email', maxLength: 254, autoComplete: 'off' })}
          </div>
        </section>

        <section className="form-card" aria-labelledby="family-title">
          <h2 id="family-title">Family and background</h2>
          <div className="form-grid">
            {field('householdSize', 'Household size', { optional: true, type: 'number', min: 1, max: 50, inputMode: 'numeric' })}
            {field('occupation', 'Occupation', { optional: true, maxLength: 80, autoComplete: 'off' })}
            <label className="admin-field">
              <span>
                Highest education <em>(optional)</em>
              </span>
              <select value={values.education} onChange={set('education')}>
                <option value="">—</option>
                {Object.entries(EDUCATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-field">
              <input type="checkbox" checked={values.isPwd} onChange={set('isPwd')} />
              <span>
                <strong>Person with disability (PWD)</strong>
                <small>Helps plan accessible services.</small>
              </span>
            </label>
            {field('emergencyContactName', 'Emergency contact person', { optional: true, maxLength: 160, autoComplete: 'off' })}
            {field('emergencyContactNumber', 'Emergency contact number', { optional: true, type: 'tel', autoComplete: 'off' })}
            <label className="admin-field form-grid__wide">
              <span>
                Notes <em>(optional)</em>
              </span>
              <textarea value={values.notes} onChange={set('notes')} rows={3} maxLength={2000} aria-invalid={Boolean(errors.notes)} />
              {errors.notes && <small className="admin-field__error">{errors.notes}</small>}
            </label>
          </div>
        </section>

        <section className="form-card" aria-labelledby="colleges-title">
          <h2 id="colleges-title">Assigned colleges and departments</h2>
          <p className="form-card__hint">
            Colleges and departments that will follow this beneficiary. Their users can then see the record and
            record services. A college that serves or receives a referral for them also sees it.
          </p>
          <div className="college-checks">
            {colleges.map((c) => (
              <label key={c.id} className={`college-check${values.collegeIds.includes(c.id) ? ' is-selected' : ''}`}>
                <input type="checkbox" checked={values.collegeIds.includes(c.id)} onChange={() => toggleCollege(c.id)} />
                <strong>{c.code}</strong>
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          {errors.collegeIds && <small className="admin-field__error">{errors.collegeIds}</small>}
        </section>

        {!editing && (
          <section className="form-card consent-card" aria-labelledby="consent-title">
            <HiOutlineShieldCheck aria-hidden="true" className="consent-card__icon" />
            <div>
              <h2 id="consent-title">Data privacy consent</h2>
              <label className="check-field">
                <input type="checkbox" checked={consent} onChange={(e) => {
                  setConsent(e.target.checked)
                  clearError('consent')
                }} aria-invalid={Boolean(errors.consent)} />
                <span>
                  <strong>The beneficiary (or their guardian) consented to this data being collected.</strong>
                  <small>
                    Required under the Data Privacy Act of 2012 (RA 10173). The information is used only for MCU community
                    programs and services.
                  </small>
                </span>
              </label>
              {errors.consent && <small className="admin-field__error">{errors.consent}</small>}
            </div>
          </section>
        )}

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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save beneficiary'}
          </button>
        </div>
      </form>

      {addingBarangay && <AddBarangayModal onClose={() => setAddingBarangay(false)} onAdded={onBarangayAdded} />}
    </div>
  )
}

function AddBarangayModal({ onClose, onAdded }) {
  const [values, setValues] = useState({ name: '', city: 'Caloocan City' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    e.stopPropagation() // don't submit the beneficiary form behind the dialog
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      onAdded(await createBarangay(values))
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])))
      if (!err.details?.length) setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Add barangay"
      description="Partner barangays appear in the list for every user."
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="barangay-form" className="btn btn--purple" disabled={saving}>
            {saving ? 'Adding…' : 'Add barangay'}
          </button>
        </>
      }
    >
      <form id="barangay-form" className="admin-form" onSubmit={onSubmit} noValidate>
        <label className="admin-field">
          <span>Barangay name</span>
          <input value={values.name} onChange={set('name')} placeholder="Barangay 123" maxLength={120} autoFocus aria-invalid={Boolean(errors.name)} />
          {errors.name && <small className="admin-field__error">{errors.name}</small>}
        </label>
        <label className="admin-field">
          <span>City or municipality</span>
          <input value={values.city} onChange={set('city')} maxLength={120} aria-invalid={Boolean(errors.city)} />
          {errors.city && <small className="admin-field__error">{errors.city}</small>}
        </label>
        {formError && (
          <p className="admin-alert" role="alert">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
