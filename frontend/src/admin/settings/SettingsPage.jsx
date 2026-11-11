import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteUser, listUsers, updateUser } from '../../api/admin.api.js'
import { ROLE_LABELS, ROLES } from '../../constants/roles.js'
import UserFormModal from './UserFormModal.jsx'
import './settings.css'

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Never'

const initials = (user) =>
  (user.name || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export default function SettingsPage() {
  const { user: me, reloadUser } = useCurrentUser()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | user
  const [confirm, setConfirm] = useState(null) // { action: 'deactivate' | 'delete', user }
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

  const load = useCallback(async (term) => {
    try {
      setUsers(await listUsers(term))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  // Debounced search; also does the first load.
  useEffect(() => {
    const id = setTimeout(() => load(search.trim()), search ? 250 : 0)
    return () => clearTimeout(id)
  }, [search, load])

  const flash = (type, text) => setNotice({ type, text })

  async function setActive(user, isActive) {
    try {
      const saved = await updateUser(user.id, { isActive })
      setUsers((list) => list.map((u) => (u.id === saved.id ? saved : u)))
      flash('success', `${saved.name || saved.email} is now ${isActive ? 'active' : 'deactivated'}.`)
    } catch (err) {
      flash('error', err.message)
    }
    setConfirm(null)
  }

  async function remove(user) {
    try {
      await deleteUser(user.id)
      setUsers((list) => list.filter((u) => u.id !== user.id))
      flash('success', `${user.name || user.email} was removed.`)
    } catch (err) {
      flash('error', err.message)
    }
    setConfirm(null)
  }

  async function onSaved(saved) {
    // Changed your own role: load the new permissions; Settings may no longer be yours.
    if (saved.id === me.id && saved.role !== me.roles[0]) {
      await reloadUser()
      navigate('/admin/dashboard', { replace: true })
      return
    }
    const isNew = editing === 'new'
    setUsers((list) => (isNew ? [saved, ...list] : list.map((u) => (u.id === saved.id ? saved : u))))
    flash('success', isNew ? `${saved.email} can now sign in.` : 'Changes saved.')
    setEditing(null)
  }

  const activeCount = users.filter((u) => u.isActive).length

  return (
    <div className="admin-page">
      <div className="admin-page__header settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage who can sign in to the CRO admin portal and what they can do.</p>
        </div>
      </div>

      <section className="admin-panel data-panel" aria-labelledby="users-title">
        <div className="data-panel__top">
          <div>
            <h2 id="users-title">Users</h2>
            <p className="data-panel__meta">
              {status === 'ready' && `${users.length} ${users.length === 1 ? 'user' : 'users'} · ${activeCount} active`}
            </p>
          </div>
          <div className="data-panel__tools">
            <label className="search-input">
              <HiOutlineMagnifyingGlass aria-hidden="true" />
              <span className="visually-hidden">Search users</span>
              <input type="search" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <button type="button" className="btn btn--purple" onClick={() => setEditing('new')}>
              <HiOutlineUserPlus aria-hidden="true" /> Add user
            </button>
          </div>
        </div>

        {notice && (
          <div className={`admin-notice admin-notice--${notice.type}`} role="status">
            <span>{notice.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
              ×
            </button>
          </div>
        )}

        {status === 'loading' && <p className="data-empty">Loading users…</p>}
        {status === 'error' && <p className="data-empty">Couldn't load users. Please refresh the page.</p>}
        {status === 'ready' && users.length === 0 && (
          <p className="data-empty">{search ? 'No users match your search.' : 'No users yet.'}</p>
        )}

        {status === 'ready' && users.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === me.id
                return (
                  <tr key={user.id} className={user.isActive ? '' : 'is-inactive'}>
                    <td data-label="User">
                      <div className="user-cell">
                        <span className="user-cell__avatar" aria-hidden="true">
                          {initials(user)}
                        </span>
                        <div>
                          <strong>
                            {user.name || '—'}
                            {isSelf && <span className="you-tag">You</span>}
                          </strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role">
                      <span className={`role-pill role-pill--${user.role}`}>{ROLE_LABELS[user.role] ?? user.role}</span>
                      {user.college && (
                        <span className="role-college" title={user.college.name}>
                          {user.college.name}
                        </span>
                      )}
                      {user.role === ROLES.COORDINATOR && (
                        <span className="role-college" title={user.barangays?.map((b) => b.name).join(', ')}>
                          {user.barangays?.length
                            ? user.barangays.length === 1
                              ? user.barangays[0].name
                              : `${user.barangays.length} barangays`
                            : 'No barangays assigned'}
                        </span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span className={`status-dot${user.isActive ? ' is-active' : ''}`}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td data-label="Last sign-in" className="data-table__muted">
                      {formatDateTime(user.lastLoginAt)}
                    </td>
                    <td className="data-table__actions">
                      <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${user.email}`} onClick={() => setEditing(user)}>
                        <HiOutlinePencilSquare />
                      </button>
                      {!isSelf &&
                        (user.isActive ? (
                          <button
                            type="button"
                            className="icon-btn"
                            title="Deactivate"
                            aria-label={`Deactivate ${user.email}`}
                            onClick={() => setConfirm({ action: 'deactivate', user })}
                          >
                            <HiOutlineNoSymbol />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="icon-btn"
                            title="Reactivate"
                            aria-label={`Reactivate ${user.email}`}
                            onClick={() => setActive(user, true)}
                          >
                            <HiOutlineCheckCircle />
                          </button>
                        ))}
                      {!isSelf && (
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          title="Remove"
                          aria-label={`Remove ${user.email}`}
                          onClick={() => setConfirm({ action: 'delete', user })}
                        >
                          <HiOutlineTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {editing && (
        <UserFormModal
          key={editing === 'new' ? 'new' : editing.id}
          open
          user={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me.id}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      <Modal
        open={Boolean(confirm)}
        size="sm"
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'delete' ? 'Remove user?' : 'Deactivate user?'}
        description={confirm?.user.email}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => (confirm.action === 'delete' ? remove(confirm.user) : setActive(confirm.user, false))}
            >
              {confirm?.action === 'delete' ? 'Remove' : 'Deactivate'}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          {confirm?.action === 'delete'
            ? 'They will no longer be able to sign in, and they will be removed from the list. To keep their history visible, deactivate them instead.'
            : 'They will be signed out immediately and won’t be able to sign in again until you reactivate them.'}
        </p>
      </Modal>
    </div>
  )
}
