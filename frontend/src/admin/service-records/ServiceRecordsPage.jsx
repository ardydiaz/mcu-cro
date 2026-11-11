import { Route, Routes } from 'react-router-dom'
import RequireRole from '../../auth/RequireRole.jsx'
import { SERVICE_EDITORS } from '../../constants/roles.js'
import ServiceRecordDetail from './ServiceRecordDetail.jsx'
import ServiceRecordFormPage from './ServiceRecordForm.jsx'
import ServiceRecordList from './ServiceRecordList.jsx'

// /admin/service-records/*
export default function ServiceRecordsPage() {
  const editorsOnly = (page) => <RequireRole roles={SERVICE_EDITORS}>{page}</RequireRole>
  return (
    <Routes>
      <Route index element={<ServiceRecordList />} />
      <Route path="new" element={editorsOnly(<ServiceRecordFormPage />)} />
      <Route path=":id" element={<ServiceRecordDetail />} />
      <Route path=":id/edit" element={editorsOnly(<ServiceRecordFormPage />)} />
    </Routes>
  )
}
