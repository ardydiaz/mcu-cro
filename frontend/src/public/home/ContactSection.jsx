import { useState } from 'react'
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi'
import { submitInquiry } from '../../api/public.api.js'
import { SITE } from '../../constants/site.js'

const EMPTY = { name: '', email: '', message: '' }

export default function ContactSection() {
  const [values, setValues] = useState(EMPTY)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'sending', message: '' })
    try {
      await submitInquiry(values)
      setValues(EMPTY)
      setStatus({
        state: 'success',
        message: 'Your message has been sent. Thank you for reaching out; we will get back to you as soon as possible.',
      })
    } catch {
      setStatus({
        state: 'error',
        message: `We couldn't send your message right now. Please try again later or email us at ${SITE.email}.`,
      })
    }
  }

  const sending = status.state === 'sending'

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__intro reveal">
          <span className="eyebrow">Get in touch</span>
          <h2 id="contact-title">Send us a message</h2>
          <p>Have a question, a partnership idea, or a community in need? We would love to hear from you.</p>

          <ul className="contact__info">
            <li>
              <span>
                <HiOutlineLocationMarker aria-hidden="true" />
              </span>
              <div>
                <strong>Visit</strong>
                {SITE.address.join(', ')}
              </div>
            </li>
            <li>
              <span>
                <HiOutlinePhone aria-hidden="true" />
              </span>
              <div>
                <strong>Call</strong>
                <a href={SITE.phoneHref}>{SITE.phone}</a>
              </div>
            </li>
            <li>
              <span>
                <HiOutlineMail aria-hidden="true" />
              </span>
              <div>
                <strong>Email</strong>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </div>
            </li>
          </ul>
        </div>

        <form className="contact__form reveal" onSubmit={onSubmit} style={{ '--reveal-delay': '120ms' }}>
          <div className="contact__row">
            <label className="field">
              <span>Name</span>
              <input name="name" value={values.name} onChange={onChange} autoComplete="name" required maxLength={120} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" required maxLength={160} />
            </label>
          </div>
          <label className="field">
            <span>Message</span>
            <textarea name="message" value={values.message} onChange={onChange} rows={5} required maxLength={2000} />
          </label>

          <button type="submit" className="btn btn--purple" disabled={sending}>
            {sending ? 'Sending…' : 'Send message'}
          </button>

          <p className={`contact__status contact__status--${status.state}`} role="status" aria-live="polite">
            {status.message}
          </p>
        </form>
      </div>
    </section>
  )
}
