import { Link } from 'react-router-dom'
import { SEX_LABELS } from '../../constants/beneficiaries.js'
import { ageOf, formatDate } from '../shared/format.js'
import DateRange from './DateRange.jsx'
import ReportShell from './ReportShell.jsx'
import ReportTable from './ReportTable.jsx'
import { dateSpan, describeRange, n } from './reportUtils.js'
import useReport from './useReport.js'

// Report 2 – Beneficiaries per program: program, number of beneficiaries, list of beneficiaries.
const programName = (r) => r.program?.name ?? 'No specific program'
const programKey = (r) => (r.program ? String(r.program.id) : 'none')

const SUMMARY_COLUMNS = [
  { label: 'Program', cell: programName },
  { label: 'Beneficiaries', numeric: true, cell: (r) => n(r.beneficiaries), csv: (r) => r.beneficiaries },
  { label: 'Services', numeric: true, cell: (r) => n(r.services), csv: (r) => r.services },
  { label: 'Activity dates', cell: (r) => dateSpan(r.firstDate, r.lastDate) },
]

const LIST_COLUMNS = [
  { label: 'Beneficiary ID', cell: (b) => <Link to={`/admin/beneficiaries/${b.id}`}>{b.code}</Link>, csv: (b) => b.code },
  { label: 'Name', cell: (b) => b.name },
  { label: 'Age', numeric: true, cell: (b) => ageOf(b.birthDate) },
  { label: 'Sex', cell: (b) => SEX_LABELS[b.sex] },
  { label: 'Barangay', cell: (b) => b.barangay },
  { label: 'Services', numeric: true, cell: (b) => b.services },
  { label: 'Last service', cell: (b) => formatDate(b.lastDate) },
]

export default function ProgramReport() {
  const state = useReport('programs')
  const { filters, setFilters, setFilter } = state
  const rangeText = describeRange(filters.from, filters.to)

  return (
    <ReportShell
      title="Beneficiaries per program"
      description="Number of beneficiaries reached by each program, counted from their service records. Click a program to list its beneficiaries."
      rangeText={`Services: ${rangeText}`}
      state={state}
      filters={<DateRange label="Services" from={filters.from} to={filters.to} onChange={setFilters} />}
      stats={
        state.report && [
          { label: 'Programs with activity', value: n(state.report.summary.filter((r) => r.program).length) },
          { label: 'Services', value: n(state.report.summary.reduce((t, r) => t + r.services, 0)) },
        ]
      }
    >
      {(report) => {
        const selected = report.summary.find((r) => programKey(r) === filters.programId)
        return (
          <>
            <ReportTable
              title="Summary"
              subtitle={`Services: ${rangeText} · a beneficiary in several programs is counted in each`}
              columns={SUMMARY_COLUMNS}
              rows={report.summary}
              exportName="beneficiaries-per-program"
              onRowClick={(r) => setFilter('programId', programKey(r))}
              isActive={(r) => r === selected}
            />
            {report.beneficiaries && (
              <ReportTable
                title={`Beneficiaries — ${selected ? programName(selected) : 'program'}`}
                subtitle={`${report.beneficiaries.length} beneficiaries`}
                columns={LIST_COLUMNS}
                rows={report.beneficiaries}
                exportName={`program-${(selected ? programName(selected) : 'program').toLowerCase().replace(/\W+/g, '-')}`}
                onClose={() => setFilter('programId', '')}
              />
            )}
          </>
        )
      }}
    </ReportShell>
  )
}
