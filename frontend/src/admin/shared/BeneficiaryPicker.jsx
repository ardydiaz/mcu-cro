import { useEffect, useId, useState } from 'react'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { listBeneficiaries } from '../../api/admin.api.js'
import { SEX_LABELS } from '../../constants/beneficiaries.js'
import { ageOf, initialsOf, listName } from './format.js'

// Search-as-you-type picker for a beneficiary (name, contact or BEN-ID).
// `value` is the chosen beneficiary (from the API) or null. With `locked`, the
// choice is shown but can't be changed (e.g. when editing a record).
export default function BeneficiaryPicker({ value, onChange, error, locked = false, autoFocus = false }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ query: '', items: [] })
  const [active, setActive] = useState(0)
  const term = query.trim()

  useEffect(() => {
    if (!term) return
    let current = true
    const timer = setTimeout(() => {
      listBeneficiaries({ search: term, pageSize: 8 }).then(
        (data) => current && setResults({ query: term, items: data.items }),
        () => current && setResults({ query: term, items: [] }),
      )
    }, 250)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [term])

  const open = Boolean(term) && results.query === term
  const choose = (b) => {
    onChange(b)
    setQuery('')
    setActive(0)
  }

  if (value) {
    return (
      <div className={`picked-person${error ? ' is-invalid' : ''}`}>
        <span className="person-cell__avatar" aria-hidden="true">
          {initialsOf(value)}
        </span>
        <div>
          <strong>{listName(value)}</strong>
          <span>
            {value.code}
            {value.birthDate && ` · ${ageOf(value.birthDate)} yrs · ${SEX_LABELS[value.sex]}`}
            {value.barangay && ` · ${value.barangay.name}`}
          </span>
        </div>
        {!locked && (
          <button type="button" className="btn btn--outline" onClick={() => onChange(null)}>
            Change
          </button>
        )}
      </div>
    )
  }

  function onKeyDown(e) {
    if (!open || results.items.length === 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.items.length) % results.items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results.items[active])
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="picker">
      <div className={`search-input picker__input${error ? ' is-invalid' : ''}`}>
        <HiOutlineMagnifyingGlass aria-hidden="true" />
        <input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && results.items[active] ? `${id}-${results.items[active].id}` : undefined}
          aria-invalid={Boolean(error)}
          aria-label="Search beneficiary"
          placeholder="Search by name, contact number or BEN-ID…"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" className="picker__list">
          {results.items.length === 0 && <li className="picker__empty">No beneficiary found. Register them in Beneficiaries first.</li>}
          {results.items.map((b, i) => (
            <li
              key={b.id}
              id={`${id}-${b.id}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(b)}
            >
              <span className="person-cell__avatar" aria-hidden="true">
                {initialsOf(b)}
              </span>
              <span>
                <strong>{listName(b)}</strong>
                <small>
                  {b.code} · {ageOf(b.birthDate)} yrs · {SEX_LABELS[b.sex]} · {b.barangay.name}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
