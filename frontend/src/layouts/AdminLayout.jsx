import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin">
      <aside />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
