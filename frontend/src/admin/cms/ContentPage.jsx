import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { HiOutlineBookOpen, HiOutlineCalendarDays, HiOutlineBuildingLibrary, HiOutlineInboxArrowDown, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2'
import RequireRole from '../../auth/RequireRole.jsx'
import useCurrentUser from '../../auth/useCurrentUser.js'
import { getContentSummary } from '../../api/admin.api.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import DirectoryPage from './DirectoryPage.jsx'
import MaterialDetail from './MaterialDetail.jsx'
import MaterialFormPage from './MaterialForm.jsx'
import MaterialList from './MaterialList.jsx'
import MessagesPage from './MessagesPage.jsx'
import PostDetail from './PostDetail.jsx'
import PostFormPage from './PostForm.jsx'
import PostList from './PostList.jsx'
import './cms.css'

// /admin/cms/* — Community Website content (requirements Project 1, Steps 4 and 7).
// Links are absolute: this page sits on a splat route (see ReportsPage).
const BASE = '/admin/cms'

export default function ContentPage() {
  const { hasRole } = useCurrentUser()
  const publisher = hasRole(...CONTENT_PUBLISHERS)
  const { pathname } = useLocation()
  const [summary, setSummary] = useState(null)

  // Refresh the badges whenever the user moves between content pages.
  useEffect(() => {
    getContentSummary().then(setSummary, () => {})
  }, [pathname])

  const tabs = [
    { path: 'materials', label: 'Learning materials', Icon: HiOutlineBookOpen, count: summary?.pendingResources },
    { path: 'posts', label: 'Activities & announcements', Icon: HiOutlineCalendarDays, count: summary?.pendingPosts },
    { path: 'directory', label: 'Colleges, programs & barangays', Icon: HiOutlineBuildingLibrary },
    ...(publisher ? [{ path: 'messages', label: 'Messages', Icon: HiOutlineInboxArrowDown, count: summary?.newMessages }] : []),
  ]

  return (
    <div className="admin-page">
      <div className="admin-page__header page-header-actions">
        <div>
          <h1>Website content</h1>
          <p>
            {publisher
              ? 'Review and publish what colleges submit, and keep the Community Website up to date.'
              : 'Prepare learning materials and activity documentation. CRO reviews them before they appear on the website.'}
          </p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="btn btn--outline">
          <HiOutlineArrowTopRightOnSquare aria-hidden="true" /> Open the website
        </a>
      </div>

      <nav className="report-tabs" aria-label="Content sections">
        {tabs.map(({ path, label, Icon, count }) => (
          <NavLink key={path} to={`${BASE}/${path}`} className="report-tab">
            <Icon aria-hidden="true" />
            {label}
            {count > 0 && (
              <span className="tab-count" title={path === 'messages' ? 'New messages' : 'Waiting for review'}>
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Navigate to={`${BASE}/materials`} replace />} />
        <Route path="materials" element={<MaterialList />} />
        <Route path="materials/new" element={<MaterialFormPage />} />
        <Route path="materials/:id" element={<MaterialDetail />} />
        <Route path="materials/:id/edit" element={<MaterialFormPage />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/new" element={<PostFormPage />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="posts/:id/edit" element={<PostFormPage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route
          path="messages"
          element={
            <RequireRole roles={CONTENT_PUBLISHERS}>
              <MessagesPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to={`${BASE}/materials`} replace />} />
      </Routes>
    </div>
  )
}
