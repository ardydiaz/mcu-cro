import { HttpError } from '../utils/httpError.js'

// Usage: router.post('/', validate(createUserSchema), handler)
// Parses req[source] with a Zod schema and replaces it with the parsed value.
export default function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {})
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
      return next(new HttpError(400, 'Please check the highlighted fields.', details))
    }
    // req.query is a getter in Express 5, so parsed queries go on req.validated.
    if (source === 'body') req.body = result.data
    else req.validated = { ...req.validated, [source]: result.data }
    next()
  }
}
