import { useEffect, useRef, useState } from 'react'
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi'
import { getInquiryFormToken, submitInquiry } from '../../api/public.api.js'
import { INQUIRY_TOPIC_LABELS } from '../../constants/content.js'
import { SITE } from '../../constants/site.js'

const EMPTY = { topic: 'general', name: '', email: '', phone: '', organization: '', message: '', website: '' }

// Contact / community coordination form. Messages go to the CRO inbox in the
// admin portal (Content → Messages).
export function ContactForm({ initialTopic = 'general' }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, topic: INQUIRY_TOPIC_LABELS[initialTopic] ? initialTopic : 'general' }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  // Signed time the form was shown; the server ignores messages sent within
  // seconds of it (bots). Fetched again after each message.
  const formToken = useRef(null)
  const loadToken = () =>
    getInquiryFormToken().then(
      (token) => (formToken.current = token),
      () => (formToken.current = null),
    )

  useEffect(() => {
    loadToken()
  }, [])

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    setErrors((errs) => (errs[e.target.name] ? { ...errs, [e.target.name]: undefined } : errs))
  }

  // A fresh token must be a few seconds old before it is accepted.
  async function freshToken() {
    await loadToken()
    await new Promise((resolve) => setTimeout(resolve, 3200))
    return formToken.current
  }

  async function send() {
    try {
      await submitInquiry({ ...values, formToken: formToken.current ?? (await freshToken()) })
    } catch (err) {
      // The page was open for a very long time: get a new token and send once more.
      if (!err.details?.some((d) => d.field === 'formToken')) throw err
      await submitInquiry({ ...values, formToken: await freshToken() })
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'sending', message: '' })
    setErrors({})
    try {
      await send()
      loadToken()
      setValues({ ...EMPTY, topic: values.topic })
      setStatus({
        state: 'success',
        message: 'Your message has been sent. Thank you for reaching out; the Community Relations Office will get back to you soon.',
      })
    } catch (err) {
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])))
        setStatus({ state: 'error', message: 'Please check the highlighted fields.' })
      } else {
        setStatus({
          state: 'error',
          message: err.status === 429 ? err.message : `We couldn't send your message right now. Please try again later or email us at ${SITE.email}.`,
        })
      }
    }
  }

  const field = (name, label, props = {}) => (
    <label className="field">
      <span>
        {label}
        {props.optional && <em> (optional)</em>}
      </span>
      <input name={name} value={values[name]} onChange={onChange} aria-invalid={Boolean(errors[name])} {...{ ...props, optional: undefined }} />
      {errors[name] && <small className="field__error">{errors[name]}</small>}
    </label>
  )

  const sending = status.state === 'sending'
  return (
    <form className="contact__form reveal" onSubmit={onSubmit} noValidate style={{ '--reveal-delay': '120ms' }}>
      <label className="field">
        <span>What is this about?</span>
        <select name="topic" value={values.topic} onChange={onChange}>
          {Object.entries(INQUIRY_TOPIC_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="contact__row">
        {field('name', 'Name', { autoComplete: 'name', required: true, maxLength: 120 })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true, maxLength: 160 })}
      </div>
      <div className="contact__row">
        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', maxLength: 20, optional: true })}
        {field('organization', 'Barangay, school or organization', { autoComplete: 'organization', maxLength: 160, optional: true })}
      </div>
      <label className="field">
        <span>Message</span>
        <textarea name="message" value={values.message} onChange={onChange} rows={5} required maxLength={2000} aria-invalid={Boolean(errors.message)} />
        {errors.message && <small className="field__error">{errors.message}</small>}
      </label>
      {/* Spam trap: hidden from people; bots that fill it in are ignored. */}
      <label className="visually-hidden" aria-hidden="true">
        Website
        <input name="website" value={values.website} onChange={onChange} tabIndex={-1} autoComplete="off" />
      </label>

      <button type="submit" className="btn btn--purple" disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>

      <p className={`contact__status contact__status--${status.state}`} role="status" aria-live="polite">
        {status.message}
      </p>
    </form>
  )
}

export function ContactInfo() {
  return (
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
  )
}

export default function ContactSection() {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__intro reveal">
          <span className="eyebrow">Get in touch</span>
          <h2 id="contact-title">Send us a message</h2>
          <p>Have a question, a partnership idea, or a community in need? We would love to hear from you.</p>
          <ContactInfo />
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
