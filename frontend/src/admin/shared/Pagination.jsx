import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'

// "21–40 of 75   ‹ Page 2 of 4 ›". Renders nothing when everything fits on one page.
export default function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <nav className="pagination" aria-label="Pages">
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
      </span>
      <div>
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <HiChevronLeft />
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button type="button" className="icon-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <HiChevronRight />
        </button>
      </div>
    </nav>
  )
}
