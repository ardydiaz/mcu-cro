import { useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineArrowUturnLeft, HiOutlineEyeSlash } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import { reviewContent } from '../../api/admin.api.js'
import { CONTENT_STATUS_LABELS } from '../../constants/content.js'

// Draft → For review → Published, or Sent back (with CRO's note).
export const StatusPill = ({ status }) => <span className={`pill pill--content-${status}`}>{CONTENT_STATUS_LABELS[status]}</span>

// Save buttons for content forms. College users submit for review; CRO staff
// publish directly. On a published item, CRO staff "Save changes" (stays published).
export function SaveButtons({ publisher, status, saving, onSave }) {
  const published = status === 'published'
  return (
    <>
      {!published && (
        <button type="button" className="btn btn--outline" disabled={saving} onClick={() => onSave('draft')}>
          Save as draft
        </button>
      )}
      {publisher ? (
        <button type="button" className="btn btn--purple" disabled={saving} onClick={() => onSave('publish')}>
          {saving ? 'Saving…' : published ? 'Save changes' : 'Publish on the website'}
        </button>
      ) : (
        <button type="button" className="btn btn--purple" disabled={saving} onClick={() => onSave('submit')}>
          {saving ? 'Saving…' : 'Submit to CRO for review'}
        </button>
      )}
    </>
  )
}

// Review box on a content detail page (CRO staff): publish, send back with a note, or unpublish.
export function ReviewPanel({ kind, item, onReviewed }) {
  const [sendingBack, setSendingBack] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function decide(decision, extra = {}) {
    setBusy(true)
    setError('')
    try {
      onReviewed(await reviewContent(kind, item.id, { decision, ...extra }), decision)
      setSendingBack(false)
      setNote('')
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`form-card review-panel review-panel--${item.status}`} aria-labelledby="review-title">
      <h2 id="review-title">Review</h2>
      {item.status === 'pending' && <p>Submitted for review. Check the content, then publish it or send it back with a note.</p>}
      {item.status === 'draft' && <p>This is a draft and isn't on the website.</p>}
      {item.status === 'rejected' && <p>Sent back to the author. It can be published once it's ready.</p>}
      {item.status === 'published' && <p>Visible on the website. Unpublish to take it down.</p>}
      <div className="review-panel__actions">
        {item.status !== 'published' ? (
          <>
            <button type="button" className="btn btn--purple" disabled={busy} onClick={() => decide('publish')}>
              <HiOutlineCheckCircle aria-hidden="true" /> Publish
            </button>
            {item.status === 'pending' && (
              <button type="button" className="btn btn--outline" disabled={busy} onClick={() => setSendingBack(true)}>
                <HiOutlineArrowUturnLeft aria-hidden="true" /> Send back
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn--outline" disabled={busy} onClick={() => decide('unpublish')}>
            <HiOutlineEyeSlash aria-hidden="true" /> Unpublish
          </button>
        )}
      </div>
      {error && !sendingBack && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}

      <Modal
        open={sendingBack}
        size="sm"
        onClose={() => setSendingBack(false)}
        title="Send back to the author"
        description="They will see your note and can update the content."
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setSendingBack(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--purple" disabled={busy} onClick={() => decide('reject', { note })}>
              Send back
            </button>
          </>
        }
      >
        <label className="admin-field">
          <span>What should be changed?</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={1000} aria-invalid={Boolean(error)} autoFocus />
          {error && <small className="admin-field__error">{error}</small>}
        </label>
      </Modal>
    </section>
  )
}
