import { todayIso } from '../shared/format.js'

const shift = (iso, { months = 0, days = 0 }) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Quick ranges, computed from today's date in the Philippines.
function presets() {
  const today = todayIso()
  const monthStart = `${today.slice(0, 8)}01`
  const lastMonthStart = shift(monthStart, { months: -1 })
  return [
    ['all', 'All time', '', ''],
    ['month', 'This month', monthStart, today],
    ['last-month', 'Last month', lastMonthStart, shift(monthStart, { days: -1 })],
    ['year', 'This year', `${today.slice(0, 4)}-01-01`, today],
    ['12m', 'Last 12 months', shift(today, { months: -12, days: 1 }), today],
  ]
}

// From/to date filter with quick presets. `label` says which date is filtered.
export default function DateRange({ from = '', to = '', onChange, label = 'Date' }) {
  const options = presets()
  const current = options.find(([, , f, t]) => f === from && t === to)?.[0] ?? 'custom'
  return (
    <div className="date-range">
      <label>
        <span className="date-range__label">{label}</span>
        <select
          className="filter-select"
          value={current}
          onChange={(e) => {
            const preset = options.find(([value]) => value === e.target.value)
            if (preset) onChange({ from: preset[2], to: preset[3] })
          }}
        >
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
          {current === 'custom' && <option value="custom">Custom range</option>}
        </select>
      </label>
      <label>
        <span className="visually-hidden">From</span>
        <input type="date" className="filter-select date-range__input" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} />
      </label>
      <span aria-hidden="true">–</span>
      <label>
        <span className="visually-hidden">To</span>
        <input type="date" className="filter-select date-range__input" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} />
      </label>
    </div>
  )
}
