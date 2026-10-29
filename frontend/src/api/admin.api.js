import { request } from './client.js'

export { request }

const json = (method, body) => ({ method, body: JSON.stringify(body) })

// Portal users (admin only)
export const listUsers = (search) =>
  request(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const createUser = (data) => request('/admin/users', json('POST', data))
export const updateUser = (id, data) => request(`/admin/users/${id}`, json('PATCH', data))
export const deleteUser = (id) => request(`/admin/users/${id}`, { method: 'DELETE' })
