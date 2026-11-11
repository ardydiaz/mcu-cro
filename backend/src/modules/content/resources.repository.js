import { db } from '../../config/db.js'
import { parseVideoUrl } from '../../utils/videos.js'

const SELECT = `SELECT r.*, c.code AS college_code, c.name AS college_name, c.slug AS college_slug,
                       f.original_name AS file_name, f.mime_type AS file_mime, f.size_bytes AS file_size,
                       cu.name AS created_by_name, ru.name AS reviewed_by_name
                FROM learning_resources r
                JOIN colleges c ON c.id = r.college_id
                LEFT JOIN files f ON f.id = r.file_id
                LEFT JOIN users cu ON cu.id = r.created_by
                LEFT JOIN users ru ON ru.id = r.reviewed_by`

// `internal` adds the workflow fields the admin portal needs.
export const toResource = (row, internal = false) =>
  row && {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    topic: row.topic,
    language: row.language,
    college: { id: row.college_id, code: row.college_code, name: row.college_name, slug: row.college_slug },
    video: row.video_url ? parseVideoUrl(row.video_url) : null,
    file: row.file_id
      ? { id: row.file_id, name: row.file_name, mimeType: row.file_mime, size: row.file_size, url: `/api/public/files/${row.file_id}` }
      : null,
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at,
    ...(internal && {
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
  collegeId: 'college_id',
  topic: 'topic',
  type: 'type',
  title: 'title',
  description: 'description',
  videoUrl: 'video_url',
  fileId: 'file_id',
  language: 'language',
  isFeatured: 'is_featured',
  status: 'status',
  reviewNote: 'review_note',
  publishedAt: 'published_at',
  reviewedBy: 'reviewed_by',
}
const fieldsOf = (data) => Object.entries(data).filter(([key, value]) => key in COLUMNS && value !== undefined)

// Public visitors only ever get published, non-removed items.
function scope({ publicOnly = false, scopeCollegeId = null } = {}) {
  const where = ['r.deleted_at IS NULL']
  const params = []
  if (publicOnly) where.push("r.status = 'published'")
  if (scopeCollegeId) {
    where.push('r.college_id = ?')
    params.push(scopeCollegeId)
  }
  return { where, params }
}

export async function findById(id, options) {
  const { where, params } = scope(options)
  const [rows] = await db.query(`${SELECT} WHERE r.id = ? AND ${where.join(' AND ')} LIMIT 1`, [id, ...params])
  return toResource(rows[0], !options?.publicOnly)
}

export async function list({ search, collegeId, type, topic, status, featured, page = 1, pageSize = 20 }, options) {
  const { where, params } = scope(options)
  const add = (sql, ...values) => {
    where.push(sql)
    params.push(...values)
  }
  if (search) add('(r.title LIKE ? OR r.topic LIKE ? OR r.description LIKE ?)', `%${search}%`, `%${search}%`, `%${search}%`)
  if (collegeId) add('r.college_id = ?', collegeId)
  if (type) add('r.type = ?', type)
  if (topic) add('r.topic = ?', topic)
  if (status) add('r.status = ?', status)
  if (featured) add('r.is_featured = TRUE')
  const whereSql = where.join(' AND ')

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM learning_resources r WHERE ${whereSql}`, params)
  // Admin lists show items waiting for review first.
  const order = options?.publicOnly
    ? 'r.is_featured DESC, r.published_at DESC, r.id DESC'
    : "r.status = 'pending' DESC, r.updated_at DESC, r.id DESC"
  const [rows] = await db.query(`${SELECT} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize])
  return { items: rows.map((row) => toResource(row, !options?.publicOnly)), total: Number(total), page, pageSize }
}

// Topics in use, for filters and suggestions: [{ topic, count }]
export async function topics(options) {
  const { where, params } = scope(options)
  const [rows] = await db.query(
    `SELECT r.topic, COUNT(*) AS count FROM learning_resources r WHERE ${where.join(' AND ')} GROUP BY r.topic ORDER BY r.topic`,
    params,
  )
  return rows.map((r) => ({ topic: r.topic, count: Number(r.count) }))
}

export async function create(data, actorId) {
  const fields = fieldsOf(data)
  const columns = [...fields.map(([key]) => COLUMNS[key]), 'created_by', 'updated_by']
  const [result] = await db.execute(
    `INSERT INTO learning_resources (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    [...fields.map(([, value]) => value), actorId, actorId],
  )
  return findById(result.insertId)
}

export async function update(id, changes, actorId) {
  const fields = fieldsOf(changes)
  if (fields.length > 0) {
    const set = [...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_by = ?'].join(', ')
    await db.execute(`UPDATE learning_resources SET ${set} WHERE id = ? AND deleted_at IS NULL`, [...fields.map(([, v]) => v), actorId, id])
  }
  return findById(id)
}

export async function remove(id, actorId) {
  await db.execute('UPDATE learning_resources SET deleted_at = CURRENT_TIMESTAMP(3), updated_by = ? WHERE id = ?', [actorId, id])
}

export async function countByStatus(status, scopeCollegeId) {
  const { where, params } = scope({ scopeCollegeId })
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM learning_resources r WHERE ${where.join(' AND ')} AND r.status = ?`, [
    ...params,
    status,
  ])
  return Number(total)
}
