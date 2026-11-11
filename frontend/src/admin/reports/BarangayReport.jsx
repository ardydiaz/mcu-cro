import { Link } from 'react-router-dom'
import { SEX_LABELS } from '../../constants/beneficiaries.js'
import { ageOf, formatDate } from '../shared/format.js'
import DateRange from './DateRange.jsx'
import ReportShell from './ReportShell.jsx'
import ReportTable from './ReportTable.jsx'
import { describeRange, n, sumRows } from './reportUtils.js'
import useReport from './useReport.js'

// Report 1 – Beneficiaries per barangay: total beneficiaries and their profile.
const NUMBERS = ['total', 'male', 'female', 'minors', 'adults', 'seniors', 'pwd']
const num = (label, field) => ({ label, numeric: true, cell: (r) => n(r[field]), csv: (r) => r[field] })

const SUMMARY_COLUMNS = [
  { label: 'Barangay', cell: (r) => (r.barangay ? `${r.barangay.name}, ${r.barangay.city}` : 'Total'), csv: (r) => (r.barangay ? `${r.barangay.name}, ${r.barangay.city}` : 'Total') },
  num('Beneficiaries', 'total'),
  num('Male', 'male'),
  num('Female', 'female'),
  num('Children (0–17)', 'minors'),
  num('Adults (18–59)', 'adults'),
  num('Seniors (60+)', 'seniors'),
  num('PWD', 'pwd'),
]

const LIST_COLUMNS = [
  { label: 'Beneficiary ID', cell: (b) => <Link to={`/admin/beneficiaries/${b.id}`}>{b.code}</Link>, csv: (b) => b.code },
  { label: 'Name', cell: (b) => b.name },
  { label: 'Age', numeric: true, cell: (b) => ageOf(b.birthDate) },
  { label: 'Sex', cell: (b) => SEX_LABELS[b.sex] },
  { label: 'PWD', cell: (b) => (b.isPwd ? 'Yes' : ''), csv: (b) => (b.isPwd ? 'Yes' : 'No') },
  { label: 'Services received', numeric: true, cell: (b) => b.services },
  { label: 'Registered', cell: (b) => formatDate(b.registeredAt) },
]

export default function BarangayReport() {
  const state = useReport('barangays')
  const { filters, setFilters, setFilter } = state
  const rangeText = describeRange(filters.from, filters.to)

  return (
    <ReportShell
      title="Beneficiaries per barangay"
      description="Number of registered beneficiaries in each partner barangay, with their profile. Click a barangay to list its beneficiaries."
      rangeText={`Registered: ${rangeText}`}
      state={state}
      filters={<DateRange label="Registered" from={filters.from} to={filters.to} onChange={setFilters} />}
      stats={
        state.report && [
          { label: 'Beneficiaries', value: n(sumRows(state.report.summary, ['total']).total) },
          { label: 'Barangays with beneficiaries', value: n(state.report.summary.filter((r) => r.total > 0).length) },
          { label: 'Seniors (60+)', value: n(sumRows(state.report.summary, ['seniors']).seniors) },
          { label: 'PWD', value: n(sumRows(state.report.summary, ['pwd']).pwd) },
        ]
      }
    >
      {(report) => {
        const selected = report.summary.find((r) => String(r.barangay.id) === filters.barangayId)
        return (
          <>
            <ReportTable
              title="Summary"
              subtitle={`Registered: ${rangeText}`}
              columns={SUMMARY_COLUMNS}
              rows={report.summary}
              totals={{ barangay: null, ...sumRows(report.summary, NUMBERS) }}
              exportName="beneficiaries-per-barangay"
              onRowClick={(r) => setFilter('barangayId', String(r.barangay.id))}
              isActive={(r) => r === selected}
            />
            {report.beneficiaries && (
              <ReportTable
                title={`Beneficiaries in ${selected?.barangay.name ?? 'the barangay'}`}
                subtitle={`${report.beneficiaries.length} beneficiaries`}
                columns={LIST_COLUMNS}
                rows={report.beneficiaries}
                exportName={`beneficiaries-${(selected?.barangay.name ?? 'barangay').toLowerCase().replace(/\W+/g, '-')}`}
                onClose={() => setFilter('barangayId', '')}
              />
            )}
          </>
        )
      }}
    </ReportShell>
  )
}
