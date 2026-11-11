import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineArrowTopRightOnSquare, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePaperAirplane } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteContent, getContent, updateContent } from '../../api/admin.api.js'
import { VideoEmbed } from '../../components/content/ContentCards.jsx'
import { formatBytes, fileKind } from '../../components/content/contentFormat.js'
import { LANGUAGE_LABELS, RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import Detail from '../shared/Detail.jsx'
import { formatDateTime } from '../shared/format.js'
import useFilePreview from './useFilePreview.js'
import { ReviewPanel, StatusPill } from './Workflow.jsx'

// /admin/cms/materials/:id — preview, details and review.
export default function MaterialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, hasRole } = useCurrentUser()
  const publisher = hasRole(...CONTENT_PUBLISHERS)
  const [loaded, setLoaded] = useState({ id: null })
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    getContent('resources', id).then(
      (material) => current && setLoaded({ id, material }),
      (err) => current && setLoaded({ id, error: err }),
    )
    return () => {
      current = false
    }
  }, [id])

  const m = loaded.material
  const preview = useFilePreview(m?.file?.id, Boolean(m?.file))

  if (loaded.id !== id) return <p className="data-empty">Loading…</p>
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

  // College users can't change published items (CRO can).
  const canEdit = publisher || (user.college && m.status !== 'published')

  async function submit() {
    try {
      const saved = await updateContent('resources', m.id, { action: 'submit' })
      setLoaded({ id, material: saved })
      setNotice('Submitted to CRO for review.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    try {
      await deleteContent('resources', m.id)
      navigate('/admin/cms/materials', { replace: true, state: { notice: `“${m.title}” was removed.` } })
    } catch (err) {
      setError(err.message)
      setConfirming(false)
    }
  }

  const isImage = m.file?.mimeType.startsWith('image/')
  const isPdf = m.file?.mimeType === 'application/pdf'

  return (
    <div>
      <Link to="/admin/cms/materials" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Learning materials
      </Link>
      <header className="profile-head">
        <div className="profile-head__main">
          <h1>{m.title}</h1>
          <p>
            <StatusPill status={m.status} />
            {m.isFeatured && <span className="tag">Featured</span>}
            <span>
              {RESOURCE_TYPE_LABELS[m.type]} · {m.college.code} · {m.topic}
            </span>
          </p>
        </div>
        <div className="profile-head__actions">
          {!publisher && ['draft', 'rejected'].includes(m.status) && (
            <button type="button" className="btn btn--purple" onClick={submit}>
              <HiOutlinePaperAirplane aria-hidden="true" /> Submit for review
            </button>
          )}
          {canEdit && (
            <Link to={`/admin/cms/materials/${m.id}/edit`} className="btn btn--outline">
              <HiOutlinePencilSquare aria-hidden="true" /> Edit
            </Link>
          )}
          {m.status === 'published' && (
            <a href={`/learning-resources/${m.id}`} target="_blank" rel="noreferrer" className="btn btn--outline">
              <HiOutlineArrowTopRightOnSquare aria-hidden="true" /> View on website
            </a>
          )}
          {canEdit && (
            <button type="button" className="btn btn--outline btn--outline-danger" onClick={() => setConfirming(true)} aria-label="Remove material">
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
      {error && (
        <p className="admin-alert profile-notice" role="alert">
          {error}
        </p>
      )}
      {m.status === 'rejected' && m.reviewNote && (
        <p className="admin-warning profile-notice">
          <strong>Sent back by CRO:</strong> {m.reviewNote}
        </p>
      )}

      <div className="profile-grid">
        <div className="profile-grid__main">
          <section className="form-card">
            <h2>Preview</h2>
            {m.video && <VideoEmbed video={m.video} title={m.title} />}
            {isImage && preview && <img src={preview} alt={m.title} className="cms-preview-image" />}
            {isPdf && preview && <iframe src={preview} title={`${m.title} (PDF)`} className="cms-preview-pdf" />}
            {m.file && !isImage && !isPdf && (
              <p className="side-note">
                {fileKind(m.file.mimeType)} file: {m.file.name} ({formatBytes(m.file.size)}). Visitors download it from the website.
              </p>
            )}
            {m.file && preview && (
              <a href={preview} download={m.file.name} className="btn btn--outline btn--sm form-gap">
                Download {m.file.name}
              </a>
            )}
          </section>
          <section className="form-card">
            <h2>Details</h2>
            <dl className="detail-grid">
              <Detail label="College/department">{m.college.name}</Detail>
              <Detail label="Topic">{m.topic}</Detail>
              <Detail label="Type of material">{RESOURCE_TYPE_LABELS[m.type]}</Detail>
              <Detail label="Language">{LANGUAGE_LABELS[m.language]}</Detail>
              <Detail label="Description" wide text>
                {m.description}
              </Detail>
            </dl>
          </section>
        </div>
        <aside className="profile-grid__side">
          {publisher && (
            <ReviewPanel
              kind="resources"
              item={m}
              onReviewed={(saved, decision) => {
                setLoaded({ id, material: saved })
                setNotice({ publish: 'Published on the website.', reject: 'Sent back to the author.', unpublish: 'Taken off the website.' }[decision])
              }}
            />
          )}
          <section className="form-card">
            <h2>Record</h2>
            <dl className="detail-grid detail-grid--single">
              <Detail label="Added">
                {formatDateTime(m.createdAt)}
                {m.createdByName && ` by ${m.createdByName}`}
              </Detail>
              <Detail label="Last updated">{formatDateTime(m.updatedAt)}</Detail>
              <Detail label="Published">{m.publishedAt && `${formatDateTime(m.publishedAt)}${m.reviewedByName ? ` by ${m.reviewedByName}` : ''}`}</Detail>
            </dl>
          </section>
        </aside>
      </div>

      <Modal
        open={confirming}
        size="sm"
        onClose={() => setConfirming(false)}
        title="Remove this material?"
        description={m.title}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={remove}>
              Remove
            </button>
          </>
        }
      >
        <p className="confirm-text">It will be taken off the website and out of the list. It is kept for the audit log.</p>
      </Modal>
    </div>
  )
}
