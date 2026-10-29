import { useState } from 'react'
import { HiOutlineShieldCheck, HiOutlineUser } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import { createUser, updateUser } from '../../api/admin.api.js'
import { ROLES } from '../../constants/roles.js'

const ROLE_OPTIONS = [
  {
    value: ROLES.ADMIN,
    label: 'Administrator',
    Icon: HiOutlineShieldCheck,
    text: 'Everything, including Settings and managing users.',
  },
  {
    value: ROLES.STAFF,
    label: 'Staff',
    Icon: HiOutlineUser,
    text: 'Day-to-day CRO work. No access to Settings.',
  },
]

// Add a user (user = null) or edit one. Calls onSaved(savedUser) on success.
export default function UserFormModal({ open, user, isSelf, onClose, onSaved }) {
  const editing = Boolean(user)
  const [values, setValues] = useState(() => ({
    email: user?.email ?? '',
    name: user?.name ?? '',
    role: user?.role ?? ROLES.STAFF,
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      const saved = editing
        ? await updateUser(user.id, { name: values.name, ...(!isSelf && { role: values.role }) })
        : await createUser(values)
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

        <fieldset className="admin-field" disabled={isSelf}>
          <legend>Role</legend>
          <div className="role-options">
            {ROLE_OPTIONS.map(({ value, label, Icon, text }) => (
              <label key={value} className={`role-option${values.role === value ? ' is-selected' : ''}`}>
                <input type="radio" name="role" value={value} checked={values.role === value} onChange={set('role')} />
                <span className="role-option__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{text}</small>
                </span>
              </label>
            ))}
          </div>
          {isSelf && <small className="admin-field__hint">You can't change your own role.</small>}
          {errors.role && <small className="admin-field__error">{errors.role}</small>}
        </fieldset>

        {formError && (
          <p className="admin-alert" role="alert">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
