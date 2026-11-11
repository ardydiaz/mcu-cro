import { Route, Routes } from 'react-router-dom'
import RequireRole from '../../auth/RequireRole.jsx'
import { SERVICE_EDITORS } from '../../constants/roles.js'
import ReferralDetail from './ReferralDetail.jsx'
import ReferralFormPage from './ReferralForm.jsx'
import ReferralList from './ReferralList.jsx'

// /admin/referrals/*
export default function ReferralsPage() {
  const editorsOnly = (page) => <RequireRole roles={SERVICE_EDITORS}>{page}</RequireRole>
  return (
    <Routes>
      <Route index element={<ReferralList />} />
      <Route path="new" element={editorsOnly(<ReferralFormPage />)} />
      <Route path=":id" element={<ReferralDetail />} />
      <Route path=":id/edit" element={editorsOnly(<ReferralFormPage />)} />
    </Routes>
  )
}
