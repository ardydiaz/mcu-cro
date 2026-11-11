// Display helpers for beneficiary, service and referral records.

// Where a referral goes: an MCU college/department or an outside facility.
export const destinationOf = (referral) => (referral.referredToCollege ? referral.referredToCollege.name : referral.referredToFacility)

// Today's date in the Philippines as YYYY-MM-DD (default for date fields).
export const todayIso = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)

// Age in whole years from a 'YYYY-MM-DD' birth date.
export function ageOf(birthDate) {
  if (!birthDate) return null
  const [y, m, d] = birthDate.split('-').map(Number)
  const today = new Date()
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1
  return age >= 0 ? age : null
}

export const fullName = (b) => [b.firstName, b.middleName, b.lastName, b.suffix].filter(Boolean).join(' ')

// "Cruz, Pedro M." for lists sorted by last name.
export const listName = (b) =>
  `${b.lastName}${b.suffix ? ` ${b.suffix}` : ''}, ${b.firstName}${b.middleName ? ` ${b.middleName[0]}.` : ''}`

export const initialsOf = (b) => `${b.firstName[0] ?? ''}${b.lastName[0] ?? ''}`.toUpperCase()

export const formatDate = (value) =>
  value
    ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
