import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { createContent, getContent, listBarangays, listColleges, listPrograms, updateContent } from '../../api/admin.api.js'
import { POST_KIND_LABELS } from '../../constants/content.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import { todayIso } from '../shared/format.js'
import FileUpload, { PhotoListUpload } from './FileUpload.jsx'
import { SaveButtons } from './Workflow.jsx'

// /admin/cms/posts/new (optionally ?kind=announcement) and /admin/cms/posts/:id/edit
export default function PostFormPage() {
  const { id } = useParams()
  const [loaded, setLoaded] = useState(id ? null : { post: null })

  useEffect(() => {
    if (!id) return
    getContent('posts', id).then(
      (post) => setLoaded({ post }),
      (error) => setLoaded({ error }),
    )
  }, [id])

  if (!loaded) return <p className="data-empty">Loading…</p>
  if (loaded.error) {
    return (
      <div className="admin-empty">
        <h2>{loaded.error.status === 404 ? 'Post not found' : "Couldn't load this post"}</h2>
        <Link to="/admin/cms/posts" className="btn btn--outline">
          Back to posts
        </Link>
      </div>
    )
  }
  return <PostForm key={id ?? 'new'} post={loaded.post} />
}

function PostForm({ post }) {
  const editing = Boolean(post)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, hasRole } = useCurrentUser()
  const publisher = hasRole(...CONTENT_PUBLISHERS)
  const [values, setValues] = useState(() => ({
    kind: post?.kind ?? (params.get('kind') === 'announcement' ? 'announcement' : 'activity'),
    title: post?.title ?? '',
    eventDate: post?.eventDate ?? todayIso(),
    location: post?.location ?? '',
    barangayId: post?.barangay ? String(post.barangay.id) : '',
    programId: post?.program ? String(post.program.id) : '',
    collegeId: post?.college ? String(post.college.id) : String(user.college?.id ?? ''),
    summary: post?.summary ?? '',
    body: post?.body ?? '',
    cover: post?.coverFileId ? { id: post.coverFileId, name: 'Current cover photo', mimeType: 'image/jpeg' } : null,
    photos: post?.photos ?? [],
  }))
  const [lists, setLists] = useState({ barangays: [], programs: [], colleges: [] })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([listBarangays(), listPrograms(), listColleges()]).then(
      ([barangays, programs, colleges]) => setLists({ barangays, programs, colleges }),
      () => {},
    )
  }, [])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }
  const isActivity = values.kind === 'activity'

  async function save(action) {
    setSaving(true)
    setErrors({})
    setFormError('')
    const toId = (v) => (v ? Number(v) : null)
    const payload = {
      action,
      kind: values.kind,
      title: values.title,
      eventDate: values.eventDate,
      location: values.location,
      barangayId: toId(values.barangayId),
      programId: toId(values.programId),
      ...(!user.college && { collegeId: toId(values.collegeId) }),
      summary: values.summary,
      body: values.body,
      coverFileId: values.cover?.id ?? null,
      photos: isActivity ? values.photos.map(({ fileId, caption }) => ({ fileId, caption: caption ?? '' })) : [],
    }
    try {
      const saved = editing ? await updateContent('posts', post.id, payload) : await createContent('posts', payload)
      const notice = { draft: 'Saved as a draft.', submit: 'Submitted to CRO for review.', publish: 'Published on the website.' }[action]
      navigate(`/admin/cms/posts/${saved.id}`, { state: { notice } })
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field.split('.')[0], d.message])))
      setFormError(err.details?.length ? 'Please check the highlighted fields.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  const back = editing ? `/admin/cms/posts/${post.id}` : '/admin/cms/posts'
  const err = (name) => errors[name] && <small className="admin-field__error">{errors[name]}</small>
  const select = (name, label, options, emptyLabel, disabled = false) => (
    <label className="admin-field">
      <span>
        {label} <em>(optional)</em>
      </span>
      <select value={values[name]} onChange={set(name)} disabled={disabled} aria-invalid={Boolean(errors[name])}>
        <option value="">{emptyLabel}</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {err(name)}
    </label>
  )

  return (
    <div>
      <Link to={back} className="back-link">
        <HiArrowLeft aria-hidden="true" /> {editing ? 'Back to post' : 'Activities & announcements'}
      </Link>
      <div className="admin-page__header">
        <h1>{editing ? `Edit ${POST_KIND_LABELS[post.kind].toLowerCase()}` : 'New activity or announcement'}</h1>
        <p>Activities appear under Community Activities (upcoming or past by date); announcements also show on the homepage.</p>
      </div>
      {post?.status === 'rejected' && post.reviewNote && (
        <p className="admin-warning form-gap-bottom">
          <strong>CRO sent this back:</strong> {post.reviewNote}
        </p>
      )}

      <form className="beneficiary-form" onSubmit={(e) => e.preventDefault()} noValidate>
        <section className="form-card">
          <h2>Post</h2>
          <div className="form-grid">
            <fieldset className="admin-field form-grid__wide">
              <legend>Kind</legend>
              <div className="segmented segmented--auto">
                {Object.entries(POST_KIND_LABELS).map(([value, label]) => (
                  <label key={value} className={values.kind === value ? 'is-selected' : ''}>
                    <input type="radio" name="kind" value={value} checked={values.kind === value} onChange={set('kind')} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="admin-field form-grid__wide">
              <span>Title</span>
              <input value={values.title} onChange={set('title')} maxLength={200} aria-invalid={Boolean(errors.title)} autoFocus={!editing} />
              {err('title')}
            </label>
            <label className="admin-field">
              <span>{isActivity ? 'Date of the activity' : 'Date'}</span>
              <input type="date" value={values.eventDate} onChange={set('eventDate')} aria-invalid={Boolean(errors.eventDate)} />
              {isActivity && <small className="admin-field__hint">A future date shows it under “Upcoming activities”.</small>}
              {err('eventDate')}
            </label>
            <label className="admin-field">
              <span>
                Location <em>(optional)</em>
              </span>
              <input value={values.location} onChange={set('location')} maxLength={200} placeholder="e.g. Barangay covered court" />
            </label>
            {select('barangayId', 'Partner barangay', lists.barangays.map((b) => [b.id, `${b.name}, ${b.city}`]), 'None')}
            {select('programId', 'Program', lists.programs.map((p) => [p.id, p.name]), 'None')}
            {select('collegeId', 'Organizing college/department', lists.colleges.map((c) => [c.id, `${c.name} (${c.code})`]), 'Community Relations Office', Boolean(user.college))}
            <label className="admin-field form-grid__wide">
              <span>
                Summary <em>(shown on cards; one or two sentences)</em>
              </span>
              <textarea value={values.summary} onChange={set('summary')} rows={2} maxLength={500} aria-invalid={Boolean(errors.summary)} />
              {err('summary')}
            </label>
            <label className="admin-field form-grid__wide">
              <span>
                Full text <em>(optional; leave a blank line between paragraphs)</em>
              </span>
              <textarea value={values.body} onChange={set('body')} rows={8} maxLength={20000} />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2>{isActivity ? 'Photos' : 'Image'}</h2>
          <FileUpload
            label="Cover photo (optional)"
            purpose="image"
            value={values.cover}
            onChange={(cover) => setValues((v) => ({ ...v, cover }))}
            hint="JPG, PNG or WebP · up to 8 MB"
            error={errors.coverFileId}
          />
          {isActivity && (
            <div className="form-gap">
              <span className="admin-field__label">Photo documentation (optional)</span>
              <PhotoListUpload photos={values.photos} onChange={(photos) => setValues((v) => ({ ...v, photos }))} error={errors.photos} />
              <small className="admin-field__hint">
                Only post photos of beneficiaries who agreed to be photographed. Avoid close-ups of children and of people receiving treatment.
              </small>
            </div>
          )}
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
          <SaveButtons publisher={publisher} status={post?.status} saving={saving} onSave={save} />
        </div>
      </form>
    </div>
  )
}
