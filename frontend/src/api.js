const configuredApi = import.meta.env.VITE_API_URL?.trim()
const productionApi = 'https://ai-mock-interview-gz51.onrender.com/api'

// Ignore the setup placeholder accidentally used by the hosted frontend.
// This keeps production requests pointed at the live API until Vercel has a
// real VITE_API_URL configured.
const API = configuredApi && !configuredApi.includes('YOUR-RENDER-SERVICE')
  ? configuredApi.replace(/\/$/, '')
  : productionApi

export const token = () => localStorage.getItem('mockmate_token')
export const request = async (path, options = {}) => {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  if (token()) headers.Authorization = `Bearer ${token()}`
  const response = await fetch(`${API}${path}`, { ...options, headers })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || 'Something went wrong') }
  return response.status === 204 ? null : response.json()
}
