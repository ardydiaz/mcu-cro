import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineClock, HiOutlineExclamationCircle } from 'react-icons/hi'
import {
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'
import { IDLE_MINUTES } from '../../auth/IdleTimeout.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import './login.css'

const ERRORS = {
  not_configured: 'Microsoft 365 sign-in has not been configured on the server yet.',
  no_access:
    "Your Microsoft 365 account doesn't have access to the CRO admin portal yet. Ask a CRO administrator to add you.",
  wrong_tenant: 'Please sign in with your MCU Microsoft 365 account.',
  session_expired: 'Your sign-in took too long or was interrupted. Please try again.',
  m365_error: "Microsoft 365 sign-in didn't complete. Please try again.",
}

const FEATURES = [
  { Icon: HiOutlineUserGroup, text: 'Beneficiaries and partner communities' },
  { Icon: HiOutlineClipboardDocumentList, text: 'Service records, referrals, and reports' },
  { Icon: HiOutlineDocumentText, text: 'Website content and announcements' },
]

const YEAR = new Date().getFullYear()

// Only allow returning to admin pages.
const safeReturnTo = (value) => (value?.startsWith('/admin') && !value.startsWith('//') ? value : '/admin')

export default function LoginPage() {
  const { status, signOutReason, signIn } = useCurrentUser()
  const [params] = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)
  const returnTo = safeReturnTo(params.get('returnTo'))
  const error = params.get('error')
  // Development only: Microsoft's error code, or the email that was refused.
  const detail = params.get('detail')

  // Coming back with the browser's Back button restores this page from cache; re-enable the button.
  useEffect(() => {
    const onShow = (e) => e.persisted && setRedirecting(false)
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  if (status === 'authenticated') return <Navigate to={returnTo} replace />

  const onSignIn = () => {
    setRedirecting(true)
    signIn(returnTo)
  }

  return (
    <div className="login">
      <aside className="login-hero">
        <img className="login-hero__photo" src="/images/slides/slide-2.jpg" alt="" />
        <div className="login-hero__inner">
          <img className="login-hero__logo" src="/images/mcu-logo-reverse.png" alt="Manila Central University" width="154" height="56" />

          <div className="login-hero__copy">
            <span className="login-hero__eyebrow">Community Relations Office</span>
            <h1>
              Admin <span>portal</span>
            </h1>
            <p>One place for the CRO team to manage outreach work and the community website.</p>
            <ul className="login-hero__features">
              {FEATURES.map(({ Icon, text }) => (
                <li key={text}>
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="login-hero__footer">
            <Link to="/" className="login-hero__back">
              <HiArrowLeft aria-hidden="true" /> Back to website
            </Link>
            <span>© {YEAR} Manila Central University</span>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel__inner">
          <img className="login-panel__logo" src="/images/mcu-logo-reverse.png" alt="Manila Central University" width="132" height="48" />

          <span className="login-panel__badge">
            <HiOutlineShieldCheck aria-hidden="true" /> Staff access
          </span>
          <h2>Welcome back</h2>
          <p className="login-panel__lead">Sign in with your MCU Microsoft 365 account to continue.</p>

          {!error && signOutReason === 'idle' && (
            <div className="login-panel__error login-panel__error--info" role="status">
              <HiOutlineClock aria-hidden="true" />
              <span>You were signed out after {IDLE_MINUTES} minutes of inactivity. Sign in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="login-panel__error" role="alert">
              <HiOutlineExclamationCircle aria-hidden="true" />
              <span>
                {ERRORS[error] ?? ERRORS.m365_error}
                {detail && (
                  <code className="login-panel__detail">
                    {error === 'no_access' ? `Signed in as ${detail}` : detail}
                  </code>
                )}
              </span>
            </div>
          )}

          <button
            type="button"
            className="login-ms"
            onClick={onSignIn}
            disabled={status === 'loading' || redirecting}
            aria-busy={redirecting}
          >
            {redirecting ? <span className="login-ms__spinner" aria-hidden="true" /> : <MicrosoftLogo />}
            {redirecting ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft 365'}
          </button>

          <div className="login-panel__divider">
            <span>How it works</span>
          </div>

          <ol className="login-steps">
            <li>You'll be taken to Microsoft to sign in securely.</li>
            <li>We check that your account is on the CRO staff list.</li>
            <li>You'll return here, signed in, for up to 8 hours, or until {IDLE_MINUTES} minutes without activity.</li>
          </ol>

          <p className="login-panel__help">
            For authorized CRO staff only. Need access? Contact the CRO administrator.
          </p>

          <Link to="/" className="login-panel__back">
            <HiArrowLeft aria-hidden="true" /> Back to website
          </Link>
        </div>
      </main>
    </div>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
