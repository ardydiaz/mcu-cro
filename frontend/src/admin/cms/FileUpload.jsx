import { useId, useState } from 'react'
import { HiOutlineArrowUpTray, HiOutlineDocument, HiOutlineXMark } from 'react-icons/hi2'
import { uploadFile } from '../../api/admin.api.js'
import { formatBytes } from '../../components/content/contentFormat.js'
import useFilePreview from './useFilePreview.js'

const DOCUMENT_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp'
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp'

// Uploads one file right after it's chosen. `value`: { id, name, size, mimeType } or null.
export default function FileUpload({ value, onChange, purpose = 'document', label, hint, error }) {
  const id = useId()
  const [state, setState] = useState({ uploading: false, error: '' })
  const preview = useFilePreview(value?.id, purpose === 'image' || value?.mimeType?.startsWith('image/'))

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setState({ uploading: true, error: '' })
    try {
      onChange(await uploadFile(file, purpose))
      setState({ uploading: false, error: '' })
    } catch (err) {
      setState({ uploading: false, error: err.message })
    }
  }

  const message = state.error || error
  return (
    <div className="file-upload">
      {label && (
        <label htmlFor={id} className="admin-field__label">
          {label}
        </label>
      )}
      {value ? (
        <div className="file-upload__chosen">
          {preview ? <img src={preview} alt="" /> : <HiOutlineDocument aria-hidden="true" className="file-upload__icon" />}
          <div>
            <strong>{value.name}</strong>
            {value.size > 0 && <span>{formatBytes(value.size)}</span>}
          </div>
          <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label={`Remove ${value.name}`}>
            <HiOutlineXMark />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className={`file-upload__drop${message ? ' is-invalid' : ''}`}>
          <HiOutlineArrowUpTray aria-hidden="true" />
          <span>{state.uploading ? 'Uploading…' : 'Choose a file'}</span>
          {hint && <small>{hint}</small>}
        </label>
      )}
      <input
        id={id}
        type="file"
        className="visually-hidden"
        accept={purpose === 'image' ? IMAGE_ACCEPT : DOCUMENT_ACCEPT}
        onChange={onPick}
        disabled={state.uploading}
      />
      {message && <small className="admin-field__error">{message}</small>}
    </div>
  )
}

// Several photos (activity documentation), each with an optional caption.
export function PhotoListUpload({ photos, onChange, error }) {
  const id = useId()
  const [state, setState] = useState({ uploading: 0, error: '' })

  async function onPick(e) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!files.length) return
    setState({ uploading: files.length, error: '' })
    const added = []
    let failed = ''
    for (const file of files) {
      try {
        const uploaded = await uploadFile(file, 'image')
        added.push({ fileId: uploaded.id, name: uploaded.name, caption: '' })
      } catch (err) {
        failed = `${file.name}: ${err.message}`
      }
    }
    onChange([...photos, ...added])
    setState({ uploading: 0, error: failed })
  }

  return (
    <div className="photo-upload">
      {photos.length > 0 && (
        <ul className="photo-upload__list">
          {photos.map((photo, i) => (
            <PhotoItem
              key={photo.fileId}
              photo={photo}
              onCaption={(caption) => onChange(photos.map((p, j) => (j === i ? { ...p, caption } : p)))}
              onRemove={() => onChange(photos.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
      )}
      <label htmlFor={id} className="file-upload__drop file-upload__drop--small">
        <HiOutlineArrowUpTray aria-hidden="true" />
        <span>{state.uploading ? `Uploading ${state.uploading} photo(s)…` : 'Add photos'}</span>
        <small>JPG, PNG or WebP, up to 8 MB each. You can select several at once.</small>
      </label>
      <input id={id} type="file" className="visually-hidden" accept={IMAGE_ACCEPT} multiple onChange={onPick} disabled={state.uploading > 0} />
      {(state.error || error) && <small className="admin-field__error">{state.error || error}</small>}
    </div>
  )
}

function PhotoItem({ photo, onCaption, onRemove }) {
  const preview = useFilePreview(photo.fileId)
  return (
    <li>
      {preview ? <img src={preview} alt="" /> : <span className="photo-upload__placeholder" />}
      <input value={photo.caption ?? ''} onChange={(e) => onCaption(e.target.value)} placeholder="Caption (optional)" maxLength={255} aria-label="Photo caption" />
      <button type="button" className="icon-btn icon-btn--danger" onClick={onRemove} aria-label="Remove photo">
        <HiOutlineXMark />
      </button>
    </li>
  )
}
