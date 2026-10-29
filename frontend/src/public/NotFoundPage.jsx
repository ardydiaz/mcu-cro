import { Link } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import PageHero from '../components/PageHero.jsx'

export default function NotFoundPage() {
  return (
    <>
      <PageHero eyebrow="404" title="Page not found">
        The page you are looking for doesn't exist or has moved.
      </PageHero>
      <div className="container section">
        <Link to="/" className="btn btn--purple">
          <HiArrowLeft aria-hidden="true" /> Back to home
        </Link>
      </div>
    </>
  )
}
