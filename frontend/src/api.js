const API = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

export const token = () => localStorage.getItem('mockmate_token')
export const request = async (path, options = {}) => {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  if (token()) headers.Authorization = `Bearer ${token()}`
  const response = await fetch(`${API}${path}`, { ...options, headers })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || 'Something went wrong') }
  return response.status === 204 ? null : response.json()
}
