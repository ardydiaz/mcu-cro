import { HiOutlinePrinter } from 'react-icons/hi2'
import { formatDateTime } from '../shared/format.js'

// Frame around every report: filters, print button, loading/error states,
// key figures, and a heading that only shows on paper.
// stats: [{ label, value }]
export default function ReportShell({ title, description, rangeText, filters, state, stats, children, waitingText }) {
  const { loading, error, report } = state
  return (
    <div className="report">
      <div className="report-toolbar no-print">
        <div className="report-filters">{filters}</div>
        <button type="button" className="btn btn--outline" onClick={() => window.print()} disabled={!report}>
          <HiOutlinePrinter aria-hidden="true" /> Print
        </button>
      </div>

      {/* Heading for the printed page */}
      <header className="report-print-head">
        <p>Manila Central University · Community Relations Office</p>
        <h1>{title}</h1>
        <p>
          {rangeText}
          {report && ` · Generated ${formatDateTime(report.generatedAt)}`}
        </p>
      </header>

      <p className="report-description no-print">{description}</p>

      {!report && !loading && !error && waitingText && <p className="data-empty report-waiting">{waitingText}</p>}
      {loading && <p className="data-empty">Generating report…</p>}
      {error && (
        <p className="admin-alert" role="alert">
          {error.details?.[0]?.message ?? error.message}
        </p>
      )}

      {report && (
        <>
          {stats && (
            <dl className="report-stats">
              {stats.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {children(report)}
        </>
      )}
    </div>
  )
}
