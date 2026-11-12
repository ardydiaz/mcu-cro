import { useState } from 'react'

const initialsOf = (user) =>
  (user.name || user.email || '')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

// A portal user's Microsoft 365 photo (copied at sign-in), or their initials
// when they have none or it can't be loaded. Decorative: the name is shown next to it.
export default function UserAvatar({ user, className }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const showPhoto = user.photoUrl && failedUrl !== user.photoUrl

  return (
    <span className={`${className}${showPhoto ? ' has-photo' : ''}`} aria-hidden="true">
      {showPhoto ? <img src={user.photoUrl} alt="" loading="lazy" onError={() => setFailedUrl(user.photoUrl)} /> : initialsOf(user)}
    </span>
  )
}
