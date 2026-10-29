import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'

// Admin routes are lazy-loaded so the public site never ships admin code.
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'))

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<h1>Home</h1>} />
          </Route>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
