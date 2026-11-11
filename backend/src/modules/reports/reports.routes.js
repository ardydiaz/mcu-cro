import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { RECORD_MANAGERS } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import { todayInManila } from '../../validators/common.js'
import { reportQuerySchema, reportTypeSchema } from '../../validators/reports.js'
import * as beneficiariesRepo from '../beneficiaries/beneficiaries.repository.js'
import * as referralsRepo from '../referrals/referrals.repository.js'
import * as serviceRecordsRepo from '../service-records/serviceRecords.repository.js'
import * as repo from './reports.repository.js'

// Mounted at /api/admin/reports. The five reports from the requirements (Step 7),
// for the CRO and IT administrators. Each generated report is audit-logged.
const router = Router()
router.use(requireRole(...RECORD_MANAGERS))

// Report 4 – Individual beneficiary history: profile, programs attended,
// services, findings, referrals and follow-ups.
async function beneficiaryHistory({ beneficiaryId, from, to }) {
  if (!beneficiaryId) throw new HttpError(400, 'Choose a beneficiary.', [{ field: 'beneficiaryId', message: 'Choose a beneficiary.' }])
  const beneficiary = await beneficiariesRepo.findById(beneficiaryId)
  if (!beneficiary) throw new HttpError(404, 'Beneficiary not found.')
  const all = { beneficiaryId, page: 1, pageSize: 1000 }
  const inRange = (date) => (!from || date >= from) && (!to || date <= to)
  const services = (await serviceRecordsRepo.list(all, null)).items.filter((s) => inRange(s.serviceDate))
  const referrals = (await referralsRepo.list(all, null)).items.filter((r) => inRange(r.referralDate))
  const programs = [...new Map(services.filter((s) => s.program).map((s) => [s.program.id, s.program.name])).values()]
  return { beneficiary, programs, services, referrals }
}

const REPORTS = {
  barangays: (q) => repo.beneficiariesPerBarangay(q, todayInManila()),
  programs: (q) => repo.beneficiariesPerProgram(q),
  services: (q) => repo.servicesRendered(q),
  beneficiary: (q) => beneficiaryHistory(q),
  community: (q) => repo.communityProgram(q),
}

router.get('/:type', validate(reportTypeSchema, 'params'), validate(reportQuerySchema, 'query'), async (req, res) => {
  const { type } = req.validated.params
  const filters = req.validated.query
  const report = await REPORTS[type](filters)
  await audit(req, 'report.view', { entityType: 'report', entityId: type, details: { filters } })
  res.json({ type, filters, generatedAt: new Date(), ...report })
})

export default router
