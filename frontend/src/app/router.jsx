import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'
import HomePage from '../public/home/HomePage.jsx'
import NotFoundPage from '../public/NotFoundPage.jsx'
import AboutPage from '../public/about/AboutPage.jsx'
import ActivitiesPage from '../public/activities/ActivitiesPage.jsx'
import PostPage from '../public/activities/PostPage.jsx'
import CollegePage from '../public/colleges/CollegePage.jsx'
import CollegesPage from '../public/colleges/CollegesPage.jsx'
import ContactPage from '../public/contact/ContactPage.jsx'
import LearningResourcesPage from '../public/learning-resources/LearningResourcesPage.jsx'
import ResourcePage from '../public/learning-resources/ResourcePage.jsx'
import PartnerCommunitiesPage from '../public/partner-communities/PartnerCommunitiesPage.jsx'
import ProgramsServicesPage from '../public/programs-services/ProgramsServicesPage.jsx'

// Admin routes are lazy-loaded so the public site never ships admin code.
const AdminApp = lazy(() => import('../admin/AdminApp.jsx'))

// Community Website sections (requirements Project 1, B. Proposed Website Sections).
const PAGES = [
  ['about', AboutPage],
  ['colleges', CollegesPage],
  ['colleges/:slug', CollegePage],
  ['programs-services', ProgramsServicesPage],
  ['learning-resources', LearningResourcesPage],
  ['learning-resources/:id', ResourcePage],
  ['activities', ActivitiesPage],
  ['activities/:slug', PostPage],
  ['partner-communities', PartnerCommunitiesPage],
  ['contact', ContactPage],
]

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            {PAGES.map(([path, Page]) => (
              <Route key={path} path={path} element={<Page />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
