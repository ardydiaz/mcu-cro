// A label/value pair inside <dl className="detail-grid">; empty values show a dash.
export default function Detail({ label, children, wide = false, text = false }) {
  const empty = children === null || children === undefined || children === '' || children === false
  return (
    <div className={wide ? 'detail detail--wide' : 'detail'}>
      <dt>{label}</dt>
      <dd className={empty ? 'is-empty' : text ? 'detail__text' : undefined}>{empty ? '—' : children}</dd>
    </div>
  )
}
