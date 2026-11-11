import { useEffect, useState } from 'react'
import { HiOutlineBuildingLibrary, HiOutlineCpuChip, HiOutlineShieldCheck, HiOutlineUserGroup } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import { createUser, listColleges, updateUser } from '../../api/admin.api.js'
import { ROLE_LABELS, ROLES } from '../../constants/roles.js'

// Descriptions follow the access matrix in the CRO requirements (Step 5).
const ROLE_OPTIONS = [
  {
    value: ROLES.CRO_ADMIN,
    Icon: HiOutlineShieldCheck,
    text: 'All beneficiary records and community data, programs and reports.',
  },
  {
    value: ROLES.COORDINATOR,
    Icon: HiOutlineUserGroup,
    text: 'Encodes beneficiaries, records services and views related records.',
  },
  {
    value: ROLES.COLLEGE,
    Icon: HiOutlineBuildingLibrary,
    text: "Their own college's beneficiaries, services and website materials.",
  },
  {
    value: ROLES.IT_ADMIN,
    Icon: HiOutlineCpuChip,
    text: 'Full access: every page, plus system administration and user accounts.',
  },
]

// Add a user (user = null) or edit one. Calls onSaved(savedUser) on success.
export default function UserFormModal({ open, user, isSelf, onClose, onSaved }) {
  const editing = Boolean(user)
  const [values, setValues] = useState(() => ({
    email: user?.email ?? '',
    name: user?.name ?? '',
    role: user?.role ?? ROLES.COORDINATOR,
    collegeId: user?.college?.id ? String(user.college.id) : '',
  }))
  const [colleges, setColleges] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listColleges()
      .then(setColleges)
      .catch(() => setFormError("Couldn't load the list of colleges. Please try again."))
  }, [])

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  const isCollege = values.role === ROLES.COLLEGE
  // Giving up your own IT Administrator role also removes your access to this page.
  const leavingItAdmin = isSelf && user.role === ROLES.IT_ADMIN && values.role !== ROLES.IT_ADMIN

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    const access = { role: values.role, collegeId: isCollege && values.collegeId ? Number(values.collegeId) : null }
    try {
      const saved = editing
        ? await updateUser(user.id, { name: values.name, ...access })
        : await createUser({ email: values.email, name: values.name, ...access })
      onSaved(saved)
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])))
      if (!err.details?.length) setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit user' : 'Add user'}
      description={
        editing
          ? user.email
          : 'They sign in with this Microsoft 365 account. Access starts as soon as you save.'
      }
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="user-form" className="btn btn--purple" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add user'}
          </button>
        </>
      }
    >
      <form id="user-form" className="admin-form" onSubmit={onSubmit} noValidate>
        {!editing && (
          <label className="admin-field">
            <span>MCU Microsoft 365 email</span>
            <input
              type="email"
              value={values.email}
              onChange={set('email')}
              placeholder="name@mcu.edu.ph"
              autoComplete="off"
              required
              autoFocus
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <small className="admin-field__error">{errors.email}</small>}
          </label>
        )}

        <label className="admin-field">
          <span>
            Full name <em>(optional, filled in from Microsoft 365 at first sign-in)</em>
          </span>
          <input value={values.name} onChange={set('name')} maxLength={160} aria-invalid={Boolean(errors.name)} />
          {errors.name && <small className="admin-field__error">{errors.name}</small>}
        </label>

        <fieldset className="admin-field">
          <legend>Role</legend>
          <div className="role-options">
            {ROLE_OPTIONS.map(({ value, Icon, text }) => (
              <label key={value} className={`role-option${values.role === value ? ' is-selected' : ''}`}>
                <input type="radio" name="role" value={value} checked={values.role === value} onChange={set('role')} />
                <span className="role-option__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>{ROLE_LABELS[value]}</strong>
                  <small>{text}</small>
                </span>
              </label>
            ))}
          </div>
          {leavingItAdmin && (
            <p className="admin-warning" role="alert">
              <strong>You're changing your own role.</strong> After saving you'll lose access to Settings and user
              accounts. Only another IT Administrator, or the command{' '}
              <code>npm run user:create -- {user.email} it_admin</code>, can give it back.
            </p>
          )}
          {errors.role && <small className="admin-field__error">{errors.role}</small>}
        </fieldset>

        {isCollege && (
          <label className="admin-field">
            <span>College or department</span>
            <select
              value={values.collegeId}
              onChange={set('collegeId')}
              required
              aria-invalid={Boolean(errors.collegeId)}
            >
              <option value="" disabled>
                Choose…
              </option>
              {colleges.map(({ id, code, name }) => (
                <option key={id} value={id}>
                  {name} ({code})
                </option>
              ))}
            </select>
            {errors.collegeId && <small className="admin-field__error">{errors.collegeId}</small>}
          </label>
        )}

        {formError && (
          <p className="admin-alert" role="alert">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
