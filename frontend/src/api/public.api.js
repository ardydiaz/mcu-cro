import { request } from './client.js'

// Public Community Website API: no sign-in, published content only.
const query = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return qs.size ? `?${qs}` : ''
}

export const getHealth = () => request('/health')

export const getHome = () => request('/public/home')

export const listResources = (params) => request(`/public/resources${query(params)}`)
export const getResource = (id) => request(`/public/resources/${id}`)
export const listTopics = () => request('/public/resources/topics').then((d) => d.topics)

export const listPosts = (params) => request(`/public/posts${query(params)}`)
export const getPost = (slug) => request(`/public/posts/${encodeURIComponent(slug)}`)

export const listColleges = () => request('/public/colleges').then((d) => d.colleges)
export const getCollege = (slug) => request(`/public/colleges/${encodeURIComponent(slug)}`)

export const listPrograms = () => request('/public/programs').then((d) => d.programs)
export const listPartners = () => request('/public/partners').then((d) => d.partners)

export const submitInquiry = (data) => request('/public/inquiries', { method: 'POST', body: JSON.stringify(data) })
