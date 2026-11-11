import { useState } from 'react'
import { HiOutlineArchiveBox, HiOutlineCheck, HiOutlineEnvelope, HiOutlineNoSymbol, HiOutlinePhone } from 'react-icons/hi2'
import Modal from '../../components/Modal.jsx'
import { listInquiries, updateInquiry } from '../../api/admin.api.js'
import { INQUIRY_TOPIC_LABELS } from '../../constants/content.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import Pagination from '../shared/Pagination.jsx'
import { formatDateTime } from '../shared/format.js'
import useListPage from '../shared/useListPage.js'

const STATUS_LABELS = { new: 'New', handled: 'Handled', archived: 'Archived', spam: 'Spam' }

// Messages from the website's contact form (Contact / Community Coordination).
// "All messages" leaves out spam; it has its own filter.
export default function MessagesPage() {
  const list = useListPage(listInquiries)
  const [changed, setChanged] = useState({}) // id → updated message, until the list reloads
  const [confirmSpam, setConfirmSpam] = useState(null)
  const [error, setError] = useState('')
  const items = (list.data?.items ?? []).map((m) => changed[m.id] ?? m)

  async function setStatus(message, status) {
    setError('')
    try {
      const saved = await updateInquiry(message.id, status)
      setChanged((c) => ({ ...c, [saved.id]: saved }))
      // Marking spam also moves the sender's other new messages: reload the list.
      if (status === 'spam' || message.status === 'spam') {
        setChanged({})
        list.reload()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="admin-panel data-panel" aria-labelledby="messages-title">
      <div className="data-panel__top">
        <div>
          <h2 id="messages-title">Messages</h2>
          <p className="data-panel__meta">Sent through the website's contact form. Reply by email or phone, then mark them handled.</p>
        </div>
        <div className="data-panel__tools">
          <FilterSelect label="Status" allLabel="All messages" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={Object.entries(STATUS_LABELS)} />
        </div>
      </div>

      {list.filters.status === 'spam' && (
        <p className="admin-notice">
          Senders of spam are blocked: anything else they send is quietly dropped. Use <strong>Not spam</strong> to unblock someone.
        </p>
      )}
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      {list.loading && <p className="data-empty">Loading…</p>}
      {list.error && <p className="data-empty">Couldn't load messages. Please refresh the page.</p>}
      {list.data?.items.length === 0 && <p className="data-empty">No messages.</p>}
      {items.length > 0 && (
        <>
          <ul className="message-list">
            {items.map((m) => (
              <li key={m.id} className={`message message--${m.status}`}>
                <div className="message__head">
                  <div>
                    <strong>{m.name}</strong>
                    {m.organization && <span> · {m.organization}</span>}
                    <span className="cell-sub">
                      {INQUIRY_TOPIC_LABELS[m.topic]} · {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <span className={`pill pill--inquiry-${m.status}`}>{STATUS_LABELS[m.status]}</span>
                </div>
                <p className="message__body">{m.message}</p>
                <div className="message__actions">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to MCU Community Relations Office')}`} className="btn btn--outline btn--sm">
                    <HiOutlineEnvelope aria-hidden="true" /> {m.email}
                  </a>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="btn btn--outline btn--sm">
                      <HiOutlinePhone aria-hidden="true" /> {m.phone}
                    </a>
                  )}
                  <span className="message__spacer" />
                  {m.status === 'spam' ? (
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setStatus(m, 'new')}>
                      <HiOutlineCheck aria-hidden="true" /> Not spam
                    </button>
                  ) : (
                    <>
                      {m.status !== 'handled' && (
                        <button type="button" className="btn btn--purple btn--sm" onClick={() => setStatus(m, 'handled')}>
                          <HiOutlineCheck aria-hidden="true" /> Mark handled
                        </button>
                      )}
                      {m.status !== 'archived' && (
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => setStatus(m, 'archived')}>
                          <HiOutlineArchiveBox aria-hidden="true" /> Archive
                        </button>
                      )}
                      {m.status !== 'new' && (
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => setStatus(m, 'new')}>
                          Mark as new
                        </button>
                      )}
                      <button type="button" className="btn btn--outline btn--outline-danger btn--sm" onClick={() => setConfirmSpam(m)}>
                        <HiOutlineNoSymbol aria-hidden="true" /> Spam
                      </button>
                    </>
                  )}
                </div>
                {m.handledByName && m.status !== 'new' && (
                  <p className="cell-sub">
                    {STATUS_LABELS[m.status]} by {m.handledByName}, {formatDateTime(m.handledAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.goTo} />
        </>
      )}

      <Modal
        open={Boolean(confirmSpam)}
        size="sm"
        onClose={() => setConfirmSpam(null)}
        title="Mark as spam?"
        description={confirmSpam?.email}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setConfirmSpam(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                setStatus(confirmSpam, 'spam')
                setConfirmSpam(null)
              }}
            >
              Mark as spam
            </button>
          </>
        }
      >
        <p className="confirm-text">
          This sender will be blocked: their other new messages move to Spam, and anything they send later is quietly
          dropped. You can undo this with <strong>Not spam</strong>.
        </p>
      </Modal>
    </section>
  )
}
