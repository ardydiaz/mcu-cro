import { HiOutlineArrowDownTray, HiOutlineXMark } from 'react-icons/hi2'
import { todayIso } from '../shared/format.js'
import { downloadCsv } from './csv.js'

// One report table in a card, with "Export to Excel" (CSV).
// columns: [{ label, cell: (row) => node, csv?: (row) => value, numeric? }]
// totals: optional row object rendered as the last line with the same columns.
// onRowClick(row) makes rows clickable (drill-down); `isActive(row)` highlights one.
export default function ReportTable({
  title,
  subtitle,
  columns,
  rows,
  totals,
  exportName,
  onRowClick,
  isActive,
  onClose,
  empty = 'No data for the selected filters.',
}) {
  const csvColumns = columns.map((c) => ({ label: c.label, csv: c.csv ?? c.cell }))
  return (
    <section className="form-card report-card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="report-card__subtitle">{subtitle}</p>}
        </div>
        <div className="report-card__actions no-print">
          {rows.length > 0 && exportName && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => downloadCsv(`${exportName}-${todayIso()}.csv`, csvColumns, totals ? [...rows, totals] : rows)}
            >
              <HiOutlineArrowDownTray aria-hidden="true" /> Export to Excel
            </button>
          )}
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close list">
              <HiOutlineXMark />
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="side-note">{empty}</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.label} scope="col" className={c.numeric ? 'is-num' : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={[onRowClick && 'is-clickable', isActive?.(row) && 'is-active'].filter(Boolean).join(' ') || undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.label} className={c.numeric ? 'is-num' : undefined}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  {columns.map((c) => (
                    <td key={c.label} className={c.numeric ? 'is-num' : undefined}>
                      {c.cell(totals)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  )
}
