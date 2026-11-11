import { Router } from 'express'
import * as repo from './colleges.repository.js'

// Mounted at /api/admin/colleges. Readable by every portal role (pickers, filters).
const router = Router()

router.get('/', async (req, res) => {
  res.json({ colleges: await repo.listActive() })
})

export default router
