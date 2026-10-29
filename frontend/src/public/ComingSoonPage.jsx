import { Link } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import PageHero from '../components/PageHero.jsx'

// Placeholder for public sections that haven't been built yet.
export default function ComingSoonPage({ title }) {
  return (
    <>
      <PageHero eyebrow="Community Relations Office" title={title}>
        This page is being prepared. Please check back soon.
      </PageHero>
      <div className="container section">
        <Link to="/" className="btn btn--purple">
          <HiArrowLeft aria-hidden="true" /> Back to home
        </Link>
      </div>
    </>
  )
}
