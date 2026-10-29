import { request } from './client.js'

export const getHealth = () => request('/health')

// TODO: backend endpoint not implemented yet.
export const submitInquiry = (data) =>
  request('/public/inquiries', { method: 'POST', body: JSON.stringify(data) })
