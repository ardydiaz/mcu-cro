import { NavLink, useSearchParams } from 'react-router-dom'
import { HiOutlineCalendarDays, HiOutlineMegaphone } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { EmptyState, PagePager, PostCard } from '../../components/content/ContentCards.jsx'
import { listPosts } from '../../api/public.api.js'
import useApi from '../../hooks/useApi.js'
import '../public-pages.css'

const PAGE_SIZE = 9

// Requirements §6 Community Activities: upcoming activities, past activities
// (with documentation), community engagement updates and announcements.
const TABS = [
  { key: 'past', label: 'Past activities', params: { kind: 'activity', when: 'past' }, empty: 'No past activities yet.' },
  { key: 'upcoming', label: 'Upcoming activities', params: { kind: 'activity', when: 'upcoming' }, empty: 'No upcoming activities are scheduled yet.' },
  { key: 'announcements', label: 'Announcements', params: { kind: 'announcement' }, empty: 'No announcements right now.' },
]

export default function ActivitiesPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0]
  const page = Number(params.get('page')) || 1
  const { data, error, loading } = useApi(() => listPosts({ ...tab.params, page, pageSize: PAGE_SIZE }), [tab.key, page])

  return (
    <>
      <PageHero eyebrow="Community engagement" title="Community Activities">
        Outreach, medical missions, seminars and other activities with our partner communities, and the latest updates
        from the Community Relations Office.
      </PageHero>

      <div className="container section">
        <nav className="pill-tabs" aria-label="Activities">
          {TABS.map((t) => (
            <NavLink
              key={t.key}
              to={`/activities?tab=${t.key}`}
              className={() => (t.key === tab.key ? 'is-active' : undefined)}
              aria-current={t.key === tab.key ? 'page' : undefined}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        {loading && <p className="loading-note">Loading…</p>}
        {error && <p className="loading-note">We couldn't load the activities. Please try again later.</p>}
        {data?.items.length === 0 && (
          <EmptyState icon={tab.key === 'announcements' ? HiOutlineMegaphone : HiOutlineCalendarDays} title={tab.empty}>
            Follow MCU on social media for the latest news.
          </EmptyState>
        )}
        {data?.items.length > 0 && (
          <>
            <div className="post-grid">
              {data.items.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
            <PagePager
              page={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPage={(n) => setParams({ tab: tab.key, page: String(n) })}
            />
          </>
        )}
      </div>
    </>
  )
}
