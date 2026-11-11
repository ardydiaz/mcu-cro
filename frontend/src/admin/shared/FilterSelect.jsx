// Compact select for list filters. `options`: [[value, label], ...]
export default function FilterSelect({ label, allLabel, value, onChange, options }) {
  return (
    <label>
      <span className="visually-hidden">{label}</span>
      <select className="filter-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
