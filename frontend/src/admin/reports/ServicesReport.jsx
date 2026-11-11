import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBarangays, listPrograms } from '../../api/admin.api.js'
import { SERVICE_TYPE_LABELS } from '../../constants/services.js'
import FilterSelect from '../shared/FilterSelect.jsx'
import { formatDate } from '../shared/format.js'
import DateRange from './DateRange.jsx'
import ReportShell from './ReportShell.jsx'
import ReportTable from './ReportTable.jsx'
import { dateSpan, describeRange, formatMonth, n } from './reportUtils.js'
import useReport from './useReport.js'

// Report 3 – Services rendered: college/department, service, number served, date, beneficiaries served.
const SUMMARY_COLUMNS = [
  { label: 'College/department', cell: (r) => r.college.name },
  { label: 'Service', cell: (r) => SERVICE_TYPE_LABELS[r.serviceType] },
  { label: 'Services rendered', numeric: true, cell: (r) => n(r.services), csv: (r) => r.services },
  { label: 'Beneficiaries served', numeric: true, cell: (r) => n(r.served), csv: (r) => r.served },
  { label: 'Dates', cell: (r) => dateSpan(r.firstDate, r.lastDate) },
]

const MONTH_COLUMNS = [
  { label: 'Month', cell: (m) => formatMonth(m.month), csv: (m) => m.month },
  { label: 'Services rendered', numeric: true, cell: (m) => n(m.services), csv: (m) => m.services },
  { label: 'Beneficiaries served', numeric: true, cell: (m) => n(m.served), csv: (m) => m.served },
]

const RECORD_COLUMNS = [
  { label: 'Date', cell: (s) => formatDate(s.serviceDate), csv: (s) => s.serviceDate },
  { label: 'Service record', cell: (s) => <Link to={`/admin/service-records/${s.id}`}>{s.code}</Link>, csv: (s) => s.code },
  { label: 'Beneficiary', cell: (s) => `${s.beneficiary.name} (${s.beneficiary.code})` },
  { label: 'Service', cell: (s) => SERVICE_TYPE_LABELS[s.serviceType] },
  { label: 'Program', cell: (s) => s.program ?? '—', csv: (s) => s.program ?? '' },
]

export default function ServicesReport() {
  const state = useReport('services')
  const { filters, setFilters, setFilter } = state
  const rangeText = describeRange(filters.from, filters.to)
  const [barangays, setBarangays] = useState([])
  const [programs, setPrograms] = useState([])

  useEffect(() => {
    listBarangays().then(setBarangays, () => {})
    listPrograms().then(setPrograms, () => {})
  }, [])

  return (
    <ReportShell
      title="Services rendered"
      description="Services provided by each college and department, and how many beneficiaries they served. Click a row to list that college's services."
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
          { label: 'Services rendered', value: n(state.report.totals.services) },
          { label: 'Beneficiaries served', value: n(state.report.totals.served) },
          { label: 'Colleges/departments', value: n(new Set(state.report.summary.map((r) => r.college.id)).size) },
        ]
      }
    >
      {(report) => {
        const college = report.summary.find((r) => String(r.college.id) === filters.collegeId)?.college
        return (
          <>
            <ReportTable
              title="By college/department and service"
              subtitle={`Services: ${rangeText} · beneficiaries are counted once per row`}
              columns={SUMMARY_COLUMNS}
              rows={report.summary}
              exportName="services-rendered"
              onRowClick={(r) => setFilter('collegeId', String(r.college.id))}
              isActive={(r) => r.college.id === college?.id}
            />
            {report.records && (
              <ReportTable
                title={`Services by ${college?.name ?? 'the college'}`}
                subtitle={`${report.records.length} services${report.records.length === 1000 ? ' (first 1,000)' : ''}`}
                columns={RECORD_COLUMNS}
                rows={report.records}
                exportName={`services-${(college?.code ?? 'college').toLowerCase()}`}
                onClose={() => setFilter('collegeId', '')}
              />
            )}
            <ReportTable title="By month" columns={MONTH_COLUMNS} rows={report.months} exportName="services-by-month" />
          </>
        )
      }}
    </ReportShell>
  )
}
