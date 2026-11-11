import { request } from './client.js'

export { request }

const json = (method, body) => ({ method, body: JSON.stringify(body) })

// Query string from an object, skipping empty values.
const query = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return qs.size ? `?${qs}` : ''
}

// Beneficiaries (view: any portal role; add/edit: editors; remove: administrators)
export const listBeneficiaries = (params) => request(`/admin/beneficiaries${query(params)}`)
export const getBeneficiary = (id) => request(`/admin/beneficiaries/${id}`)
export const createBeneficiary = (data) => request('/admin/beneficiaries', json('POST', data))
export const updateBeneficiary = (id, data) => request(`/admin/beneficiaries/${id}`, json('PATCH', data))
export const deleteBeneficiary = (id) => request(`/admin/beneficiaries/${id}`, { method: 'DELETE' })

// Service records (college users: their own college only)
export const listServiceRecords = (params) => request(`/admin/service-records${query(params)}`)
export const getServiceRecord = (id) => request(`/admin/service-records/${id}`)
export const createServiceRecord = (data) => request('/admin/service-records', json('POST', data))
export const updateServiceRecord = (id, data) => request(`/admin/service-records/${id}`, json('PATCH', data))
export const deleteServiceRecord = (id) => request(`/admin/service-records/${id}`, { method: 'DELETE' })

// Referrals (college users: from or to their own college)
export const listReferrals = (params) => request(`/admin/referrals${query(params)}`)
export const getReferral = (id) => request(`/admin/referrals/${id}`)
export const createReferral = (data) => request('/admin/referrals', json('POST', data))
export const updateReferral = (id, data) => request(`/admin/referrals/${id}`, json('PATCH', data))
export const deleteReferral = (id) => request(`/admin/referrals/${id}`, { method: 'DELETE' })

// Reports (CRO and IT administrators): barangays | programs | services | beneficiary | community
export const getReport = (type, params) => request(`/admin/reports/${type}${query(params)}`)

// Website content (requirements Project 1). kind: 'resources' | 'posts'
export const getContentSummary = () => request('/admin/content/summary')
export const listContent = (kind, params) => request(`/admin/content/${kind}${query(params)}`)
export const getContent = (kind, id) => request(`/admin/content/${kind}/${id}`)
export const createContent = (kind, data) => request(`/admin/content/${kind}`, json('POST', data))
export const updateContent = (kind, id, data) => request(`/admin/content/${kind}/${id}`, json('PATCH', data))
export const reviewContent = (kind, id, data) => request(`/admin/content/${kind}/${id}/review`, json('POST', data))
export const deleteContent = (kind, id) => request(`/admin/content/${kind}/${id}`, { method: 'DELETE' })
export const listContentTopics = () => request('/admin/content/topics').then((d) => d.topics)

export const getDirectory = () => request('/admin/content/directory')
export const updateDirectory = (type, id, data) => request(`/admin/content/directory/${type}/${id}`, json('PATCH', data))

export const listInquiries = (params) => request(`/admin/content/inquiries${query(params)}`)
export const updateInquiry = (id, status) => request(`/admin/content/inquiries/${id}`, json('PATCH', { status }))

// Files: upload (purpose 'document' or 'image'), and fetch for previews (also unpublished).
export function uploadFile(file, purpose = 'document') {
  const body = new FormData()
  body.append('file', file)
  return request(`/admin/files?purpose=${purpose}`, { method: 'POST', body })
}
export const getFileBlob = (id) => request(`/admin/files/${id}`, { as: 'blob' })

// Dashboard figures
export const getDashboard = () => request('/admin/dashboard')

// Community programs
export const listPrograms = () => request('/admin/programs').then((data) => data.programs)
export const createProgram = (data) => request('/admin/programs', json('POST', data))

// Partner barangays
export const listBarangays = () => request('/admin/barangays').then((data) => data.barangays)
export const createBarangay = (data) => request('/admin/barangays', json('POST', data))

// Colleges/departments (any portal role)
export const listColleges = () => request('/admin/colleges').then((data) => data.colleges)

// Portal users (IT Administrator only)
export const listUsers = (search) =>
  request(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const createUser = (data) => request('/admin/users', json('POST', data))
export const updateUser = (id, data) => request(`/admin/users/${id}`, json('PATCH', data))
export const deleteUser = (id) => request(`/admin/users/${id}`, { method: 'DELETE' })
