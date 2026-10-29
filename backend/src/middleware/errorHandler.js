// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500
  if (status >= 500) console.error(err)
  // Don't leak internal error details to clients.
  if (status >= 500) return res.status(status).json({ error: 'Internal Server Error' })
  res.status(status).json({ error: err.message, ...(err.details && { details: err.details }) })
}
