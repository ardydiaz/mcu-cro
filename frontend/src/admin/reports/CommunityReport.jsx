import { useEffect, useState } from 'react'
import { listBarangays, listPrograms } from '../../api/admin.api.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import DateRange from './DateRange.jsx'
import ReportShell from './ReportShell.jsx'
import ReportTable from './ReportTable.jsx'
import { dateSpan, describeRange, n, sumRows } from './reportUtils.js'
import useReport from './useReport.js'

// Report 5 – Community/program report: barangay, program, number of beneficiaries,
// services provided, activity dates and other indicators.
const NUMBERS = ['services', 'activityDays', 'referrals', 'followUpsOpen', 'followUpsDone', 'followUpsMissed']
const num = (label, field) => ({ label, numeric: true, cell: (r) => n(r[field]), csv: (r) => r[field] })
// The same beneficiary or college can appear in several rows, so these aren't summed in the total row.
const distinct = (label, field) => ({
  label,
  numeric: true,
  cell: (r) => (r.barangay ? n(r[field]) : '—'),
  csv: (r) => (r.barangay ? r[field] : ''),
})
const programName = (r) => (r.barangay ? (r.program?.name ?? 'No specific program') : '')

const COLUMNS = [
  { label: 'Barangay', cell: (r) => r.barangay?.name ?? 'Total' },
  { label: 'Program', cell: programName },
  distinct('Beneficiaries', 'beneficiaries'),
  num('Services', 'services'),
  num('Activity days', 'activityDays'),
  { label: 'Activity dates', cell: (r) => (r.barangay ? dateSpan(r.firstDate, r.lastDate) : ''), csv: (r) => (r.barangay ? `${r.firstDate} to ${r.lastDate}` : '') },
  distinct('Colleges involved', 'colleges'),
  num('Referrals', 'referrals'),
  num('Follow-ups open', 'followUpsOpen'),
  num('Follow-ups done', 'followUpsDone'),
  num('Follow-ups missed', 'followUpsMissed'),
]

export default function CommunityReport() {
  const state = useReport('community')
  const { filters, setFilters, setFilter } = state
  const rangeText = describeRange(filters.from, filters.to)
  const [barangays, setBarangays] = useState([])
  const [programs, setPrograms] = useState([])

  useEffect(() => {
    listBarangays().then(setBarangays, () => {})
    listPrograms().then(setPrograms, () => {})
  }, [])

  const rows = state.report?.rows ?? []
  const totals = { barangay: null, ...sumRows(rows, NUMBERS) }

  return (
    <ReportShell
      title="Community / program report"
      description="For each barangay and program: beneficiaries reached, services provided, activity dates, referrals and follow-ups."
      rangeText={`Services: ${rangeText}`}
      state={state}
      filters={
        <>
          <DateRange label="Services" from={filters.from} to={filters.to} onChange={setFilters} />
          <FilterSelect
            label="Barangay"
            allLabel="All barangays"
            value={filters.barangayId}
            onChange={(v) => setFilter('barangayId', v)}
            options={barangays.map((b) => [b.id, b.name])}
          />
          <FilterSelect
            label="Program"
            allLabel="All programs"
            value={filters.programId}
            onChange={(v) => setFilter('programId', v)}
            options={[...programs.map((p) => [p.id, p.name]), ['none', 'No specific program']]}
          />
        </>
      }
      stats={
        state.report && [
          { label: 'Barangays reached', value: n(new Set(rows.map((r) => r.barangay.id)).size) },
          { label: 'Services', value: n(totals.services) },
          { label: 'Referrals', value: n(totals.referrals) },
          { label: 'Open follow-ups', value: n(totals.followUpsOpen) },
        ]
      }
    >
      {() => (
        <ReportTable
          title="By barangay and program"
          subtitle={`Services: ${rangeText} · activity days = days with at least one service`}
          columns={COLUMNS}
          rows={rows}
          totals={rows.length ? totals : undefined}
          exportName="community-program-report"
        />
      )}
    </ReportShell>
  )
}
