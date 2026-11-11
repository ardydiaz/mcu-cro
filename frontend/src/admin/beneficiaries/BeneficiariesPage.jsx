import { Route, Routes } from 'react-router-dom'
import RequireRole from '../../auth/RequireRole.jsx'
import { BENEFICIARY_EDITORS } from '../../constants/roles.js'
import BeneficiaryFormPage from './BeneficiaryForm.jsx'
import BeneficiaryList from './BeneficiaryList.jsx'
import BeneficiaryProfile from './BeneficiaryProfile.jsx'

// /admin/beneficiaries/*
export default function BeneficiariesPage() {
  const editorsOnly = (page) => <RequireRole roles={BENEFICIARY_EDITORS}>{page}</RequireRole>
  return (
    <Routes>
      <Route index element={<BeneficiaryList />} />
      <Route path="new" element={editorsOnly(<BeneficiaryFormPage />)} />
      <Route path=":id" element={<BeneficiaryProfile />} />
      <Route path=":id/edit" element={editorsOnly(<BeneficiaryFormPage />)} />
    </Routes>
  )
}
