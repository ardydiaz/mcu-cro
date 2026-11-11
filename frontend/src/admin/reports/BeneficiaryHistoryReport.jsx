import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CIVIL_STATUS_LABELS, SEX_LABELS } from '../../constants/beneficiaries.js'
import { FOLLOW_UP_LABELS, REFERRAL_STATUS_LABELS, SERVICE_TYPE_LABELS, URGENCY_LABELS } from '../../constants/services.js'
import BeneficiaryPicker from '../shared/BeneficiaryPicker.jsx'
import Detail from '../shared/Detail.jsx'
import { ageOf, destinationOf, formatDate, fullName } from '../shared/format.js'
import DateRange from './DateRange.jsx'
import ReportShell from './ReportShell.jsx'
import ReportTable from './ReportTable.jsx'
import { describeRange, n } from './reportUtils.js'
import useReport from './useReport.js'

// Report 4 – Individual beneficiary history: beneficiary information, programs
// attended, services received, findings, referrals and follow-up records.
const SERVICE_COLUMNS = [
  { label: 'Date', cell: (s) => formatDate(s.serviceDate), csv: (s) => s.serviceDate },
  { label: 'Service', cell: (s) => <Link to={`/admin/service-records/${s.id}`}>{SERVICE_TYPE_LABELS[s.serviceType]}</Link>, csv: (s) => SERVICE_TYPE_LABELS[s.serviceType] },
  { label: 'College', cell: (s) => s.college.code, csv: (s) => s.college.name },
  { label: 'Program', cell: (s) => s.program?.name ?? '—', csv: (s) => s.program?.name ?? '' },
  { label: 'Findings', cell: (s) => s.findings ?? '—', csv: (s) => s.findings ?? '' },
  { label: 'Intervention', cell: (s) => s.intervention ?? '—', csv: (s) => s.intervention ?? '' },
  { label: 'Recommendation', cell: (s) => s.recommendation ?? '—', csv: (s) => s.recommendation ?? '' },
]

const REFERRAL_COLUMNS = [
  { label: 'Date', cell: (r) => formatDate(r.referralDate), csv: (r) => r.referralDate },
  { label: 'Referral', cell: (r) => <Link to={`/admin/referrals/${r.id}`}>{r.code}</Link>, csv: (r) => r.code },
  { label: 'From', cell: (r) => r.college.code, csv: (r) => r.college.name },
  { label: 'Referred to', cell: destinationOf },
  { label: 'Reason', cell: (r) => r.reason },
  { label: 'Urgency', cell: (r) => URGENCY_LABELS[r.urgency] },
  { label: 'Status', cell: (r) => REFERRAL_STATUS_LABELS[r.status] },
  { label: 'Outcome', cell: (r) => r.outcome ?? '—', csv: (r) => r.outcome ?? '' },
]

const FOLLOW_UP_COLUMNS = [
  { label: 'Follow-up date', cell: (s) => formatDate(s.followUpDate), csv: (s) => s.followUpDate },
  { label: 'Status', cell: (s) => FOLLOW_UP_LABELS[s.followUpStatus] },
  { label: 'For service', cell: (s) => `${SERVICE_TYPE_LABELS[s.serviceType]} (${formatDate(s.serviceDate)})` },
  { label: 'College', cell: (s) => s.college.code, csv: (s) => s.college.name },
  { label: 'Recommendation', cell: (s) => s.recommendation ?? '—', csv: (s) => s.recommendation ?? '' },
]

export default function BeneficiaryHistoryReport() {
  const state = useReport('beneficiary', (f) => Boolean(f.beneficiaryId))
  const { filters, setFilters, setFilter } = state
  const rangeText = describeRange(filters.from, filters.to)
  // The picker shows the chosen person; after a reload it comes from the report.
  const [picked, setPicked] = useState(null)
  const chosen = picked ?? state.report?.beneficiary ?? null

  return (
    <ReportShell
      title={`Beneficiary history${state.report ? ` — ${fullName(state.report.beneficiary)}` : ''}`}
      description="Everything recorded for one beneficiary: profile, programs attended, services, findings, referrals and follow-ups."
      rangeText={`Services and referrals: ${rangeText}`}
      state={state}
      waitingText="Search for a beneficiary to see their history."
      filters={
        <>
          <div className="report-picker">
            <BeneficiaryPicker
              value={chosen}
              onChange={(b) => {
                setPicked(b)
                setFilter('beneficiaryId', b ? String(b.id) : '')
              }}
            />
          </div>
          <DateRange label="Dates" from={filters.from} to={filters.to} onChange={setFilters} />
        </>
      }
      stats={
        state.report && [
          { label: 'Services received', value: n(state.report.services.length) },
          { label: 'Programs attended', value: n(state.report.programs.length) },
          { label: 'Referrals', value: n(state.report.referrals.length) },
          { label: 'Follow-ups', value: n(state.report.services.filter((s) => s.followUpStatus !== 'none').length) },
        ]
      }
    >
      {({ beneficiary: b, programs, services, referrals }) => (
        <>
          <section className="form-card report-card">
            <h2>Beneficiary information</h2>
            <dl className="detail-grid detail-grid--report">
              <Detail label="Beneficiary ID">
                <Link to={`/admin/beneficiaries/${b.id}`}>{b.code}</Link>
              </Detail>
              <Detail label="Name">{fullName(b)}</Detail>
              <Detail label="Birth date / age">
                {formatDate(b.birthDate)} ({ageOf(b.birthDate)} years)
              </Detail>
              <Detail label="Sex">{SEX_LABELS[b.sex]}</Detail>
              <Detail label="Civil status">{CIVIL_STATUS_LABELS[b.civilStatus]}</Detail>
              <Detail label="Barangay">
                {b.barangay.name}, {b.barangay.city}
              </Detail>
              <Detail label="Person with disability">{b.isPwd ? 'Yes' : 'No'}</Detail>
              <Detail label="Programs attended" wide>
                {programs.length > 0 && programs.join(' · ')}
              </Detail>
            </dl>
          </section>
          <ReportTable title="Services received" columns={SERVICE_COLUMNS} rows={services} exportName={`history-${b.code}-services`} empty="No services in this period." />
          <ReportTable
            title="Follow-up records"
            columns={FOLLOW_UP_COLUMNS}
            rows={services.filter((s) => s.followUpStatus !== 'none')}
            exportName={`history-${b.code}-follow-ups`}
            empty="No follow-ups in this period."
          />
          <ReportTable title="Referrals" columns={REFERRAL_COLUMNS} rows={referrals} exportName={`history-${b.code}-referrals`} empty="No referrals in this period." />
        </>
      )}
    </ReportShell>
  )
}
