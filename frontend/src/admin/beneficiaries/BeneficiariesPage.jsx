import { Route, Routes } from 'react-router-dom'
import RequireRole from '../../auth/RequireRole.jsx'
import { BENEFICIARY_EDITORS, RECORD_MANAGERS } from '../../constants/roles.js'
import BeneficiaryFormPage from './BeneficiaryForm.jsx'
import BeneficiaryImport from './BeneficiaryImport.jsx'
import BeneficiaryList from './BeneficiaryList.jsx'
import BeneficiaryProfile from './BeneficiaryProfile.jsx'

// /admin/beneficiaries/*
export default function BeneficiariesPage() {
  const editorsOnly = (page) => <RequireRole roles={BENEFICIARY_EDITORS}>{page}</RequireRole>
  return (
    <Routes>
      <Route index element={<BeneficiaryList />} />
      <Route path="new" element={editorsOnly(<BeneficiaryFormPage />)} />
      <Route path="import" element={<RequireRole roles={RECORD_MANAGERS}>{<BeneficiaryImport />}</RequireRole>} />
      <Route path=":id" element={<BeneficiaryProfile />} />
      <Route path=":id/edit" element={editorsOnly(<BeneficiaryFormPage />)} />
    </Routes>
  )
}
