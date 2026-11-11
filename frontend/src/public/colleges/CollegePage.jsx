import { Link, useParams } from 'react-router-dom'
import { HiArrowLeft, HiCheck, HiOutlineBookOpen } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { EmptyState, PostCard, ResourceCard } from '../../components/content/ContentCards.jsx'
import { paragraphs } from '../../components/content/contentFormat.js'
import { getCollege } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

// One college/department: what it does, its services, its learning materials
// grouped by topic (College → Topic → Type of Material), and its activities.
export default function CollegePage() {
  const { slug } = useParams()
  const { data, error, loading } = useApi(() => getCollege(slug), [slug])

  if (loading) return <p className="container section loading-note">Loading…</p>
  if (error) {
    return (
      <div className="container section">
        <EmptyState title="College not found">
          <Link to="/colleges">See all colleges and departments</Link>.
        </EmptyState>
      </div>
    )
  }

  const { college, resources, activities } = data
  const byTopic = Object.entries(
    resources.reduce((groups, r) => ({ ...groups, [r.topic]: [...(groups[r.topic] ?? []), r] }), {}),
  ).sort(([a], [b]) => a.localeCompare(b))

  return (
    <>
      <PageHero eyebrow={college.code} title={college.name} />
      <div className="container section">
        <Link to="/colleges" className="detail-page__back">
          <HiArrowLeft aria-hidden="true" /> Colleges & departments
        </Link>

        <div className="college-intro">
          <div className="prose">
            {college.description ? (
              paragraphs(college.description).map((p) => <p key={p}>{p}</p>)
            ) : (
              <p>
                The {college.name} takes part in MCU's community programs and shares learning materials with our partner
                communities.
              </p>
            )}
          </div>
          {college.servicesOffered.length > 0 && (
            <aside className="info-box">
              <h2>Services offered</h2>
              <ul className="check-list">
                {college.servicesOffered.map((s) => (
                  <li key={s}>
                    <HiCheck aria-hidden="true" /> {s}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        <section className="page-block" aria-labelledby="materials-title">
          <h2 id="materials-title">Learning materials</h2>
          {byTopic.length === 0 ? (
            <EmptyState icon={HiOutlineBookOpen} title="No materials yet">
              Materials from this college will appear here once published.
            </EmptyState>
          ) : (
            byTopic.map(([topic, items]) => (
              <div key={topic} className="topic-group">
                <h3>{topic}</h3>
                <div className="resource-grid">
                  {items.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {activities.length > 0 && (
          <section className="page-block" aria-labelledby="college-activities">
            <h2 id="college-activities">Community activities</h2>
            <div className="post-grid">
              {activities.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
