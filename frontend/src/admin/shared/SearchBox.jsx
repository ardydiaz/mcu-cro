import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

export default function SearchBox({ label, placeholder, value, onChange }) {
  return (
    <label className="search-input">
      <HiOutlineMagnifyingGlass aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
