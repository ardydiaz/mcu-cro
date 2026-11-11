import { useEffect, useState } from 'react'
import { HiOutlinePencilSquare } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { getDirectory, updateDirectory } from '../../api/admin.api.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'

// What the public website says about each college, program and partner barangay
// (Colleges/Departments, Programs and Services, Partner Communities pages).
export default function DirectoryPage() {
  const { user, hasRole } = useCurrentUser()
  const publisher = hasRole(...CONTENT_PUBLISHERS)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDirectory().then(setData, () => setError("Couldn't load the directory. Please refresh the page."))
  }, [])

  if (error) return <p className="data-empty">{error}</p>
  if (!data) return <p className="data-empty">Loading…</p>

  const replace = (type, saved) => setData((d) => ({ ...d, [type]: d[type].map((item) => (item.id === saved.id ? saved : item)) }))
  // College users describe their own college only.
  const colleges = user.college ? data.colleges.filter((c) => c.id === user.college.id) : data.colleges

  return (
    <div className="directory">
      <DirectorySection
        title="Colleges & departments"
        intro="Shown on the Colleges & Departments page. List one service per line."
        items={colleges}
        label={(c) => `${c.name} (${c.code})`}
        fields={[
          { name: 'description', label: 'About the college (public)' },
          { name: 'servicesOffered', label: 'Services offered to communities (one per line)', lines: true },
        ]}
        onSave={async (c, values) => replace('colleges', await updateDirectory('colleges', c.id, values))}
      />
      {publisher && (
        <>
          <DirectorySection
            title="Programs"
            intro="Shown on the Programs & Services page. Featured programs also appear on the homepage."
            items={data.programs}
            label={(p) => p.name}
            flag={{ name: 'isFeatured', label: 'Feature on the homepage', badge: 'Featured' }}
            fields={[{ name: 'description', label: 'What the program does (public)' }]}
            onSave={async (p, values) => replace('programs', await updateDirectory('programs', p.id, values))}
          />
          <DirectorySection
            title="Partner barangays"
            intro="Partner barangays are listed on the Partner Communities page, with the programs and services delivered there (totals only)."
            items={data.barangays}
            label={(b) => `${b.name}, ${b.city}`}
            flag={{ name: 'isPartner', label: 'Show as a partner community', badge: 'Partner', offBadge: 'Hidden' }}
            fields={[{ name: 'description', label: 'About the community and the partnership (public)' }]}
            onSave={async (b, values) => replace('barangays', await updateDirectory('barangays', b.id, values))}
          />
        </>
      )}
    </div>
  )
}

function DirectorySection({ title, intro, items, label, fields, flag, onSave }) {
  return (
    <section className="admin-panel data-panel directory__section">
      <div className="data-panel__top">
        <div>
          <h2>{title}</h2>
          <p className="data-panel__meta">{intro}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="data-empty">Nothing here yet.</p>
      ) : (
        <ul className="directory__list">
          {items.map((item) => (
            <DirectoryItem key={item.id} item={item} label={label(item)} fields={fields} flag={flag} onSave={onSave} />
          ))}
        </ul>
      )}
    </section>
  )
}

function DirectoryItem({ item, label, fields, flag, onSave }) {
  const toValues = () =>
    Object.fromEntries([
      ...fields.map((f) => [f.name, f.lines ? (item[f.name] ?? []).join('\n') : (item[f.name] ?? '')]),
      ...(flag ? [[flag.name, item[flag.name]]] : []),
    ])
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState(toValues)
  const [state, setState] = useState({ saving: false, error: '' })

  async function save() {
    setState({ saving: true, error: '' })
    try {
      await onSave(item, values)
      setEditing(false)
      setState({ saving: false, error: '' })
    } catch (err) {
      setState({ saving: false, error: err.details?.[0]?.message ?? err.message })
    }
  }

  const summary = fields.map((f) => (f.lines ? (item[f.name] ?? []).join(' · ') : item[f.name])).find(Boolean)
  return (
    <li className="directory__item">
      <div className="directory__head">
        <div>
          <strong>{label}</strong>
          {flag && (item[flag.name] ? <span className="tag">{flag.badge}</span> : flag.offBadge && <span className="tag tag--muted">{flag.offBadge}</span>)}
          {!editing && <p className={summary ? 'directory__summary' : 'directory__summary is-empty'}>{summary || 'No description yet.'}</p>}
        </div>
        {!editing && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              setValues(toValues())
              setEditing(true)
            }}
          >
            <HiOutlinePencilSquare aria-hidden="true" /> Edit
          </button>
        )}
      </div>
      {editing && (
        <div className="directory__form admin-form">
          {fields.map((f) => (
            <label key={f.name} className="admin-field">
              <span>{f.label}</span>
              <textarea value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} rows={f.lines ? 5 : 3} maxLength={3000} />
            </label>
          ))}
          {flag && (
            <label className="check-field">
              <input type="checkbox" checked={values[flag.name]} onChange={(e) => setValues((v) => ({ ...v, [flag.name]: e.target.checked }))} />
              <span>
                <strong>{flag.label}</strong>
              </span>
            </label>
          )}
          {state.error && (
            <p className="admin-alert" role="alert">
              {state.error}
            </p>
          )}
          <div className="directory__actions">
            <button type="button" className="btn btn--outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--purple" disabled={state.saving} onClick={save}>
              {state.saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
