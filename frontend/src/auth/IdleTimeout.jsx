import { useEffect, useState } from 'react'
import Modal from '../components/Modal.jsx'
import useCurrentUser from './useCurrentUser.js'

export const IDLE_MINUTES = 10
const IDLE_MS = IDLE_MINUTES * 60 * 1000
const WARNING_MS = 60 * 1000 // the warning shows during the last minute
const STORAGE_KEY = 'cro_last_activity'
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']

// Last activity is shared through localStorage, so working in one tab keeps
// the other admin tabs signed in too. Falls back to memory if storage is blocked.
let memoryLastActivity = Date.now()
function readLastActivity() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || memoryLastActivity
  } catch {
    return memoryLastActivity
  }
}
function writeLastActivity(time) {
  memoryLastActivity = time
  try {
    localStorage.setItem(STORAGE_KEY, String(time))
  } catch {
    // Storage blocked: this tab keeps its own timer.
  }
}

const formatCountdown = (ms) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Signs the user out after IDLE_MINUTES without mouse, keyboard, touch or
// scrolling, with a one-minute warning that lets them stay signed in.
export default function IdleTimeout() {
  const { signOut } = useCurrentUser()
  const [remaining, setRemaining] = useState(IDLE_MS)
  const warning = remaining <= WARNING_MS

  useEffect(() => {
    writeLastActivity(Date.now()) // a new session or page load counts as activity
    let lastWrite = 0

    const onActivity = () => {
      const now = Date.now()
      if (now - lastWrite < 1000) return
      // While the warning is open, only "Stay signed in" keeps the session.
      if (readLastActivity() + IDLE_MS - now <= WARNING_MS) return
      lastWrite = now
      writeLastActivity(now)
    }

    let signingOut = false
    const tick = () => {
      const left = readLastActivity() + IDLE_MS - Date.now()
      setRemaining(left)
      if (left <= 0 && !signingOut) {
        signingOut = true
        signOut({ reason: 'idle' })
      }
    }

    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, { passive: true, capture: true }))
    // Checks every second; also catches up straight away after the computer wakes from sleep.
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, onActivity, { capture: true }))
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [signOut])

  const staySignedIn = () => {
    writeLastActivity(Date.now())
    setRemaining(IDLE_MS)
  }

  return (
    <Modal
      open={warning && remaining > 0}
      size="sm"
      onClose={staySignedIn}
      title="Are you still there?"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={() => signOut()}>
            Sign out now
          </button>
          <button type="button" className="btn btn--purple" onClick={staySignedIn}>
            Stay signed in
          </button>
        </>
      }
    >
      <p className="confirm-text">
        You haven't been active for a while. To protect beneficiary records, you'll be signed out in{' '}
        <strong aria-live="polite" aria-atomic="true">
          {formatCountdown(remaining)}
        </strong>
        .
      </p>
    </Modal>
  )
}
