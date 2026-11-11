import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi2'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { createContent, getContent, listColleges, listContentTopics, updateContent } from '../../api/admin.api.js'
import { LANGUAGE_LABELS, RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import FileUpload from './FileUpload.jsx'
import { SaveButtons } from './Workflow.jsx'

// /admin/cms/materials/new and /admin/cms/materials/:id/edit
export default function MaterialFormPage() {
  const { id } = useParams()
  const [loaded, setLoaded] = useState(id ? null : { material: null })

  useEffect(() => {
    if (!id) return
    getContent('resources', id).then(
      (material) => setLoaded({ material }),
      (error) => setLoaded({ error }),
    )
  }, [id])

  if (!loaded) return <p className="data-empty">Loading…</p>
  if (loaded.error) {
    return (
      <div className="admin-empty">
        <h2>{loaded.error.status === 404 ? 'Material not found' : "Couldn't load this material"}</h2>
        <Link to="/admin/cms/materials" className="btn btn--outline">
          Back to materials
        </Link>
      </div>
    )
  }
  return <MaterialForm key={id ?? 'new'} material={loaded.material} />
}

function MaterialForm({ material }) {
  const editing = Boolean(material)
  const navigate = useNavigate()
  const { user, hasRole } = useCurrentUser()
  const publisher = hasRole(...CONTENT_PUBLISHERS)
  const [values, setValues] = useState(() => ({
    title: material?.title ?? '',
    collegeId: String(material?.college.id ?? user.college?.id ?? ''),
    topic: material?.topic ?? '',
    type: material?.type ?? '',
    language: material?.language ?? 'fil',
    description: material?.description ?? '',
    source: material?.file ? 'file' : material?.video ? 'video' : 'file',
    videoUrl: material?.video?.url ?? '',
    file: material?.file ?? null,
    isFeatured: material?.isFeatured ?? false,
  }))
  const [colleges, setColleges] = useState([])
  const [topics, setTopics] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listColleges().then(setColleges, () => {})
    listContentTopics().then(setTopics, () => {})
  }, [])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((errs) => ({ ...errs, [field]: undefined, ...(field === 'source' || field === 'videoUrl' ? { source: undefined, videoUrl: undefined } : {}) }))
  }

  async function save(action) {
    setSaving(true)
    setErrors({})
    setFormError('')
    const payload = {
      action,
      title: values.title,
      collegeId: values.collegeId ? Number(values.collegeId) : undefined,
      topic: values.topic,
      type: values.type || undefined,
      language: values.language,
      description: values.description,
      videoUrl: values.source === 'video' ? values.videoUrl : null,
      fileId: values.source === 'file' ? (values.file?.id ?? null) : null,
      ...(publisher && { isFeatured: values.isFeatured }),
    }
    try {
      const saved = editing ? await updateContent('resources', material.id, payload) : await createContent('resources', payload)
      const notice = { draft: 'Saved as a draft.', submit: 'Submitted to CRO for review.', publish: 'Published on the website.' }[action]
      navigate(`/admin/cms/materials/${saved.id}`, { state: { notice } })
    } catch (err) {
      setErrors(Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])))
      setFormError(err.details?.length ? 'Please check the highlighted fields.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  const back = editing ? `/admin/cms/materials/${material.id}` : '/admin/cms/materials'
  const err = (name) => errors[name] && <small className="admin-field__error">{errors[name]}</small>

  return (
    <div>
      <Link to={back} className="back-link">
        <HiArrowLeft aria-hidden="true" /> {editing ? 'Back to material' : 'Learning materials'}
      </Link>
      <div className="admin-page__header">
        <h1>{editing ? 'Edit learning material' : 'Add learning material'}</h1>
        <p>Organized by college/department → topic → type of material. {!publisher && 'CRO reviews it before it appears on the website.'}</p>
      </div>
      {material?.status === 'rejected' && material.reviewNote && (
        <p className="admin-warning form-gap-bottom">
          <strong>CRO sent this back:</strong> {material.reviewNote}
        </p>
      )}

      <form className="beneficiary-form" onSubmit={(e) => e.preventDefault()} noValidate>
        <section className="form-card">
          <h2>About the material</h2>
          <div className="form-grid">
            <label className="admin-field form-grid__wide">
              <span>Title</span>
              <input value={values.title} onChange={set('title')} maxLength={200} aria-invalid={Boolean(errors.title)} autoFocus={!editing} />
              {err('title')}
            </label>
            <label className="admin-field">
              <span>College or department</span>
              <select value={values.collegeId} onChange={set('collegeId')} disabled={Boolean(user.college)} aria-invalid={Boolean(errors.collegeId)}>
                <option value="" disabled>
                  Choose…
                </option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {err('collegeId')}
            </label>
            <label className="admin-field">
              <span>Topic</span>
              <input value={values.topic} onChange={set('topic')} list="topic-suggestions" maxLength={120} placeholder="e.g. Diabetes, Dental care, Nutrition" aria-invalid={Boolean(errors.topic)} />
              <datalist id="topic-suggestions">
                {topics.map((t) => (
                  <option key={t.topic} value={t.topic} />
                ))}
              </datalist>
              {err('topic')}
            </label>
            <label className="admin-field">
              <span>Type of material</span>
              <select value={values.type} onChange={set('type')} aria-invalid={Boolean(errors.type)}>
                <option value="" disabled>
                  Choose…
                </option>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {err('type')}
            </label>
            <label className="admin-field">
              <span>Language</span>
              <select value={values.language} onChange={set('language')}>
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field form-grid__wide">
              <span>
                Short description <em>(optional; shown to the public)</em>
              </span>
              <textarea value={values.description} onChange={set('description')} rows={3} maxLength={3000} />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2>The material</h2>
          <fieldset className="admin-field">
            <legend>Upload a file or link a video</legend>
            <div className="segmented segmented--auto">
              {[
                ['file', 'Upload a file (PDF, PowerPoint, Word, image)'],
                ['video', 'Video link (YouTube, Facebook, Vimeo)'],
              ].map(([value, label]) => (
                <label key={value} className={values.source === value ? 'is-selected' : ''}>
                  <input type="radio" name="source" value={value} checked={values.source === value} onChange={set('source')} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-gap">
            {values.source === 'file' ? (
              <FileUpload
                value={values.file}
                onChange={(file) => {
                  setValues((v) => ({ ...v, file }))
                  setErrors((errs) => ({ ...errs, source: undefined }))
                }}
                hint="PDF, PPT/PPTX, DOC/DOCX, JPG, PNG or WebP · up to 25 MB"
                error={errors.source}
              />
            ) : (
              <label className="admin-field">
                <span>Video link</span>
                <input type="url" value={values.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={Boolean(errors.videoUrl || errors.source)} />
                <small className="admin-field__hint">Upload the video to MCU's YouTube or Facebook page first, then paste its link here.</small>
                {err('videoUrl') || err('source')}
              </label>
            )}
          </div>
        </section>

        {publisher && (
          <section className="form-card">
            <label className="check-field">
              <input type="checkbox" checked={values.isFeatured} onChange={set('isFeatured')} />
              <span>
                <strong>Feature on the homepage</strong>
                <small>Shown under “Featured learning materials — Alaga Ko Barangay Ko: Alaga sa Bawat Edad”.</small>
              </span>
            </label>
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
          <SaveButtons publisher={publisher} status={material?.status} saving={saving} onSave={save} />
        </div>
      </form>
    </div>
  )
}
