import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import {
  HiOutlineMapPin,
  HiOutlineRectangleStack,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUser,
  HiOutlineTableCells,
} from 'react-icons/hi2'
import BarangayReport from './BarangayReport.jsx'
import BeneficiaryHistoryReport from './BeneficiaryHistoryReport.jsx'
import CommunityReport from './CommunityReport.jsx'
import ProgramReport from './ProgramReport.jsx'
import ServicesReport from './ServicesReport.jsx'
import './reports.css'

// The five reports defined in the requirements (Project 2, Step 7).
// Links here are absolute: this component sits on the splat route
// /admin/reports/*, where React Router 7 resolves relative links against the
// current URL (so "programs" from /admin/reports/barangays would loop forever).
const BASE = '/admin/reports'
const REPORTS = [
  { path: 'barangays', label: 'Beneficiaries per barangay', Icon: HiOutlineMapPin, Page: BarangayReport },
  { path: 'programs', label: 'Beneficiaries per program', Icon: HiOutlineRectangleStack, Page: ProgramReport },
  { path: 'services', label: 'Services rendered', Icon: HiOutlineClipboardDocumentCheck, Page: ServicesReport },
  { path: 'beneficiary', label: 'Beneficiary history', Icon: HiOutlineUser, Page: BeneficiaryHistoryReport },
  { path: 'community', label: 'Community / program', Icon: HiOutlineTableCells, Page: CommunityReport },
]

// /admin/reports/*
export default function ReportsPage() {
  return (
    <div className="admin-page">
      <div className="admin-page__header no-print">
        <h1>Reports</h1>
        <p>For CRO monitoring and community program planning. Print a report or export it to Excel.</p>
      </div>

      <nav className="report-tabs no-print" aria-label="Reports">
        {REPORTS.map(({ path, label, Icon }) => (
          <NavLink key={path} to={`${BASE}/${path}`} className="report-tab">
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Navigate to={`${BASE}/barangays`} replace />} />
        {REPORTS.map(({ path, Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
        <Route path="*" element={<Navigate to={`${BASE}/barangays`} replace />} />
      </Routes>
    </div>
  )
}
