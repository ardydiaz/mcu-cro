import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineArrowTopRightOnSquare, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePaperAirplane } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { deleteContent, getContent, updateContent } from '../../api/admin.api.js'
import { paragraphs } from '../../components/content/contentFormat.js'
import { POST_KIND_LABELS } from '../../constants/content.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import Detail from '../shared/Detail.jsx'
import { formatDate, formatDateTime } from '../shared/format.js'
import useFilePreview from './useFilePreview.js'
import { ReviewPanel, StatusPill } from './Workflow.jsx'

function Photo({ fileId, caption }) {
  const url = useFilePreview(fileId)
  return (
    <li>
      {url ? <img src={url} alt={caption ?? ''} /> : <span className="photo-upload__placeholder" />}
      {caption && <span>{caption}</span>}
    </li>
  )
}

// /admin/cms/posts/:id — preview, details and review.
export default function PostDetail() {
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
    getContent('posts', id).then(
      (post) => current && setLoaded({ id, post }),
      (err) => current && setLoaded({ id, error: err }),
    )
    return () => {
      current = false
    }
  }, [id])

  const p = loaded.post
  const coverPreview = useFilePreview(p?.coverFileId, Boolean(p?.coverFileId))

  if (loaded.id !== id) return <p className="data-empty">Loading…</p>
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

  const canEdit = publisher || (user.college && p.status !== 'published')
  const cover = coverPreview ?? (p.coverFileId ? null : p.coverUrl)

  async function submit() {
    try {
      setLoaded({ id, post: await updateContent('posts', p.id, { action: 'submit' }) })
      setNotice('Submitted to CRO for review.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove() {
    try {
      await deleteContent('posts', p.id)
      navigate('/admin/cms/posts', { replace: true, state: { notice: `“${p.title}” was removed.` } })
    } catch (err) {
      setError(err.message)
      setConfirming(false)
    }
  }

  return (
    <div>
      <Link to="/admin/cms/posts" className="back-link">
        <HiArrowLeft aria-hidden="true" /> Activities & announcements
      </Link>
      <header className="profile-head">
        <div className="profile-head__main">
          <h1>{p.title}</h1>
          <p>
            <StatusPill status={p.status} />
            <span>
              {POST_KIND_LABELS[p.kind]} · {formatDate(p.eventDate)}
            </span>
          </p>
        </div>
        <div className="profile-head__actions">
          {!publisher && ['draft', 'rejected'].includes(p.status) && (
            <button type="button" className="btn btn--purple" onClick={submit}>
              <HiOutlinePaperAirplane aria-hidden="true" /> Submit for review
            </button>
          )}
          {canEdit && (
            <Link to={`/admin/cms/posts/${p.id}/edit`} className="btn btn--outline">
              <HiOutlinePencilSquare aria-hidden="true" /> Edit
            </Link>
          )}
          {p.status === 'published' && (
            <a href={`/activities/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn--outline">
              <HiOutlineArrowTopRightOnSquare aria-hidden="true" /> View on website
            </a>
          )}
          {canEdit && (
            <button type="button" className="btn btn--outline btn--outline-danger" onClick={() => setConfirming(true)} aria-label="Remove post">
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
      {p.status === 'rejected' && p.reviewNote && (
        <p className="admin-warning profile-notice">
          <strong>Sent back by CRO:</strong> {p.reviewNote}
        </p>
      )}

      <div className="profile-grid">
        <div className="profile-grid__main">
          <section className="form-card">
            <h2>Preview</h2>
            {cover && <img src={cover} alt="" className="cms-preview-image" />}
            {p.summary && <p className="cms-preview-lead">{p.summary}</p>}
            <div className="cms-preview-text">
              {paragraphs(p.body).map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
            {p.photos.length > 0 && (
              <ul className="cms-photo-grid">
                {p.photos.map((photo) => (
                  <Photo key={photo.fileId} fileId={photo.fileId} caption={photo.caption} />
                ))}
              </ul>
            )}
          </section>
          <section className="form-card">
            <h2>Details</h2>
            <dl className="detail-grid">
              <Detail label="Kind">{POST_KIND_LABELS[p.kind]}</Detail>
              <Detail label="Date">{formatDate(p.eventDate)}</Detail>
              <Detail label="Location">{p.location}</Detail>
              <Detail label="Partner barangay">{p.barangay?.name}</Detail>
              <Detail label="Program">{p.program?.name}</Detail>
              <Detail label="Organizing college/department">{p.college?.name ?? 'Community Relations Office'}</Detail>
              <Detail label="Web address" wide>
                /activities/{p.slug}
              </Detail>
            </dl>
          </section>
        </div>
        <aside className="profile-grid__side">
          {publisher && (
            <ReviewPanel
              kind="posts"
              item={p}
              onReviewed={(saved, decision) => {
                setLoaded({ id, post: saved })
                setNotice({ publish: 'Published on the website.', reject: 'Sent back to the author.', unpublish: 'Taken off the website.' }[decision])
              }}
            />
          )}
          <section className="form-card">
            <h2>Record</h2>
            <dl className="detail-grid detail-grid--single">
              <Detail label="Added">
                {formatDateTime(p.createdAt)}
                {p.createdByName && ` by ${p.createdByName}`}
              </Detail>
              <Detail label="Last updated">{formatDateTime(p.updatedAt)}</Detail>
              <Detail label="Published">{p.publishedAt && `${formatDateTime(p.publishedAt)}${p.reviewedByName ? ` by ${p.reviewedByName}` : ''}`}</Detail>
            </dl>
          </section>
        </aside>
      </div>

      <Modal
        open={confirming}
        size="sm"
        onClose={() => setConfirming(false)}
        title="Remove this post?"
        description={p.title}
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
