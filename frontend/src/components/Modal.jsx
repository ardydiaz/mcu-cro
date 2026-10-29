import { useEffect, useRef } from 'react'
import { HiXMark } from 'react-icons/hi2'
import './modal.css'

// Accessible modal built on <dialog>: traps focus, closes on Esc and backdrop click.
export default function Modal({ open, title, description, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="modal__panel">
          <header className="modal__header">
            <div>
              <h2 id="modal-title">{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
              <HiXMark />
            </button>
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
