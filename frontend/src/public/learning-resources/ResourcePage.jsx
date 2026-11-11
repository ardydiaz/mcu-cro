import { Link, useParams } from 'react-router-dom'
import { HiArrowLeft, HiOutlineArrowDownTray, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2'
import { EmptyState, VideoEmbed } from '../../components/content/ContentCards.jsx'
import { fileKind, formatBytes, formatDate, paragraphs } from '../../components/content/contentFormat.js'
import { getResource } from '../../api/public.api.js'
import { LANGUAGE_LABELS, RESOURCE_TYPE_LABELS } from '../../constants/content.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

// One learning material: plays the video or shows/downloads the file.
export default function ResourcePage() {
  const { id } = useParams()
  const { data: r, error, loading } = useApi(() => getResource(id), [id])

  if (loading) return <p className="container section loading-note">Loading…</p>
  if (error) {
    return (
      <div className="container section">
        <EmptyState title="This material is not available">
          It may have been removed. <Link to="/learning-resources">Browse all learning resources</Link>.
        </EmptyState>
      </div>
    )
  }

  const isPdf = r.file?.mimeType === 'application/pdf'
  const isImage = r.file?.mimeType.startsWith('image/')

  return (
    <article className="container section detail-page">
      <Link to="/learning-resources" className="detail-page__back">
        <HiArrowLeft aria-hidden="true" /> Learning resources
      </Link>
      <header className="detail-page__head">
        <span className="eyebrow">
          {RESOURCE_TYPE_LABELS[r.type]} · {r.topic}
        </span>
        <h1>{r.title}</h1>
        <p className="detail-page__meta">
          <Link to={`/colleges/${r.college.slug}`}>{r.college.name}</Link>
          <span>· {LANGUAGE_LABELS[r.language]}</span>
          {r.publishedAt && <span>· Published {formatDate(r.publishedAt)}</span>}
        </p>
      </header>

      <div className="detail-page__media">
        {r.video && <VideoEmbed video={r.video} title={r.title} />}
        {isImage && <img src={r.file.url} alt={r.title} className="detail-page__image" />}
        {isPdf && <iframe src={r.file.url} title={`${r.title} (PDF)`} className="pdf-viewer" loading="lazy" />}
      </div>

      <div className="detail-page__actions">
        {r.video && (
          <a href={r.video.url} target="_blank" rel="noreferrer" className="btn btn--outline">
            <HiOutlineArrowTopRightOnSquare aria-hidden="true" /> Watch on {r.video.provider === 'youtube' ? 'YouTube' : r.video.provider === 'vimeo' ? 'Vimeo' : 'Facebook'}
          </a>
        )}
        {r.file && (
          <a href={r.file.url} download={r.file.name} className="btn btn--purple">
            <HiOutlineArrowDownTray aria-hidden="true" /> Download {fileKind(r.file.mimeType)} ({formatBytes(r.file.size)})
          </a>
        )}
      </div>

      {r.description && (
        <div className="prose">
          {paragraphs(r.description).map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
    </article>
  )
}
