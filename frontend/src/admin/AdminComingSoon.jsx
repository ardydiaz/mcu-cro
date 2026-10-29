import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2'

// Placeholder for admin sections that haven't been built yet.
export default function AdminComingSoon({ title }) {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>{title}</h1>
      </div>
      <div className="admin-empty">
        <span className="admin-empty__icon">
          <HiOutlineWrenchScrewdriver aria-hidden="true" />
        </span>
        <h2>Coming soon</h2>
        <p>This section is under construction.</p>
      </div>
    </div>
  )
}
