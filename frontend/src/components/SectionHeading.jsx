export default function SectionHeading({ eyebrow, title, children, center = false, light = false, id }) {
  const classes = ['section-heading', 'reveal', center && 'section-heading--center', light && 'section-heading--light']
  return (
    <div className={classes.filter(Boolean).join(' ')}>
      {eyebrow && <span className={`eyebrow${light ? ' eyebrow--light' : ''}`}>{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  )
}
