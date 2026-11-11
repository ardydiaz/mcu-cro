import { db } from '../../config/db.js'

const SELECT = `SELECT p.*, g.name AS barangay_name, pr.name AS program_name,
                       c.code AS college_code, c.name AS college_name, c.slug AS college_slug,
                       cu.name AS created_by_name, ru.name AS reviewed_by_name
                FROM posts p
                LEFT JOIN barangays g ON g.id = p.barangay_id
                LEFT JOIN programs pr ON pr.id = p.program_id
                LEFT JOIN colleges c ON c.id = p.college_id
                LEFT JOIN users cu ON cu.id = p.created_by
                LEFT JOIN users ru ON ru.id = p.reviewed_by`

const fileUrl = (id) => `/api/public/files/${id}`

export const toPost = (row, internal = false) =>
  row && {
    id: row.id,
    kind: row.kind,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    eventDate: row.event_date,
    location: row.location,
    barangay: row.barangay_id ? { id: row.barangay_id, name: row.barangay_name } : null,
    program: row.program_id ? { id: row.program_id, name: row.program_name } : null,
    college: row.college_id ? { id: row.college_id, code: row.college_code, name: row.college_name, slug: row.college_slug } : null,
    coverUrl: row.cover_file_id ? fileUrl(row.cover_file_id) : row.cover_url,
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at,
    ...(internal && {
      coverFileId: row.cover_file_id,
      status: row.status,
      reviewNote: row.review_note,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      reviewedByName: row.reviewed_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  }

const COLUMNS = {
  kind: 'kind',
  title: 'title',
  slug: 'slug',
  summary: 'summary',
  body: 'body',
  eventDate: 'event_date',
  location: 'location',
  barangayId: 'barangay_id',
  programId: 'program_id',
  collegeId: 'college_id',
  coverFileId: 'cover_file_id',
  isFeatured: 'is_featured',
  status: 'status',
  reviewNote: 'review_note',
  publishedAt: 'published_at',
  reviewedBy: 'reviewed_by',
}
const fieldsOf = (data) => Object.entries(data).filter(([key, value]) => key in COLUMNS && value !== undefined)

function scope({ publicOnly = false, scopeCollegeId = null } = {}) {
  const where = ['p.deleted_at IS NULL']
  const params = []
  if (publicOnly) where.push("p.status = 'published'")
  if (scopeCollegeId) {
    where.push('p.college_id = ?')
    params.push(scopeCollegeId)
  }
  return { where, params }
}

async function photosOf(postId) {
  const [rows] = await db.query(
    `SELECT ph.file_id, ph.caption, f.original_name FROM post_photos ph JOIN files f ON f.id = ph.file_id
     WHERE ph.post_id = ? ORDER BY ph.sort_order, ph.id`,
    [postId],
  )
  return rows.map((r) => ({ fileId: r.file_id, caption: r.caption, name: r.original_name, url: fileUrl(r.file_id) }))
}

async function findOne(column, value, options) {
  const { where, params } = scope(options)
  const [rows] = await db.query(`${SELECT} WHERE p.${column} = ? AND ${where.join(' AND ')} LIMIT 1`, [value, ...params])
  const post = toPost(rows[0], !options?.publicOnly)
  return post && { ...post, photos: await photosOf(post.id) }
}

export const findById = (id, options) => findOne('id', id, options)
export const findBySlug = (slug, options) => findOne('slug', slug, options)

// `when`: 'upcoming' (today and later, soonest first) or 'past' (newest first).
export async function list({ search, kind, when, status, collegeId, barangayId, featured, page = 1, pageSize = 20 }, options = {}) {
  const { where, params } = scope(options)
  const add = (sql, ...values) => {
    where.push(sql)
    params.push(...values)
  }
  if (search) add('(p.title LIKE ? OR p.summary LIKE ?)', `%${search}%`, `%${search}%`)
  if (kind) add('p.kind = ?', kind)
  if (when === 'upcoming') add('p.event_date >= ?', options.today)
  if (when === 'past') add('p.event_date < ?', options.today)
  if (status) add('p.status = ?', status)
  if (collegeId) add('p.college_id = ?', collegeId)
  if (barangayId) add('p.barangay_id = ?', barangayId)
  if (featured) add('p.is_featured = TRUE')
  const whereSql = where.join(' AND ')

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM posts p WHERE ${whereSql}`, params)
  const order = !options.publicOnly
    ? "p.status = 'pending' DESC, p.updated_at DESC, p.id DESC"
    : when === 'upcoming'
      ? 'p.event_date ASC, p.id ASC'
      : 'p.event_date DESC, p.id DESC'
  const [rows] = await db.query(`${SELECT} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize])
  return { items: rows.map((row) => toPost(row, !options.publicOnly)), total: Number(total), page, pageSize }
}

// URL-friendly, unique slug from the title: "MCU Medical Mission" → "mcu-medical-mission(-2)".
export async function uniqueSlug(title, excludeId = 0) {
  const base =
    title
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200) || 'post'
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`
    const [rows] = await db.query('SELECT id FROM posts WHERE slug = ? AND id <> ? LIMIT 1', [slug, excludeId])
    if (rows.length === 0) return slug
  }
}

async function replacePhotos(postId, photos) {
  await db.execute('DELETE FROM post_photos WHERE post_id = ?', [postId])
  for (const [i, photo] of photos.entries()) {
    await db.execute('INSERT INTO post_photos (post_id, file_id, caption, sort_order) VALUES (?, ?, ?, ?)', [
      postId,
      photo.fileId,
      photo.caption ?? null,
      i,
    ])
  }
}

export async function create({ photos, ...data }, actorId) {
  const fields = fieldsOf(data)
  const columns = [...fields.map(([key]) => COLUMNS[key]), 'created_by', 'updated_by']
  const [result] = await db.execute(
    `INSERT INTO posts (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    [...fields.map(([, value]) => value), actorId, actorId],
  )
  if (photos) await replacePhotos(result.insertId, photos)
  return findById(result.insertId)
}

export async function update(id, { photos, ...changes }, actorId) {
  const fields = fieldsOf(changes)
  if (fields.length > 0) {
    const set = [...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_by = ?'].join(', ')
    await db.execute(`UPDATE posts SET ${set} WHERE id = ? AND deleted_at IS NULL`, [...fields.map(([, v]) => v), actorId, id])
  }
  if (photos) await replacePhotos(id, photos)
  return findById(id)
}

export async function remove(id, actorId) {
  await db.execute('UPDATE posts SET deleted_at = CURRENT_TIMESTAMP(3), updated_by = ? WHERE id = ?', [actorId, id])
}

export async function countByStatus(status, scopeCollegeId) {
  const { where, params } = scope({ scopeCollegeId })
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM posts p WHERE ${where.join(' AND ')} AND p.status = ?`, [...params, status])
  return Number(total)
}
