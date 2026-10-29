import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'
import HomePage from '../public/home/HomePage.jsx'
import ComingSoonPage from '../public/ComingSoonPage.jsx'
import NotFoundPage from '../public/NotFoundPage.jsx'

// Admin routes are lazy-loaded so the public site never ships admin code.
const AdminApp = lazy(() => import('../admin/AdminApp.jsx'))

// Public sections not built yet; each will get its own page under src/public/.
const PLACEHOLDERS = [
  ['about', 'About Us'],
  ['programs-services', 'Programs & Services'],
  ['activities', 'Activities'],
  ['activities/:slug', 'Activities'],
  ['partner-communities', 'Partner Communities'],
  ['contact', 'Contact Us'],
  ['give', 'Give to CRO'],
]

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            {PLACEHOLDERS.map(([path, title]) => (
              <Route key={path} path={path} element={<ComingSoonPage title={title} />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
