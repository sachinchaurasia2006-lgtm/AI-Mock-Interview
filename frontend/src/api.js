const configuredApi = import.meta.env.VITE_API_URL?.trim()
const productionApi = 'https://ai-mock-interview-gz51.onrender.com/api'
const developmentApi = 'http://localhost:8081/api'

// In development, default to local backend unless explicitly overridden.
// In production, fallback to Render API if VITE_API_URL is not set or is placeholder.
const API = configuredApi && !configuredApi.includes('YOUR-RENDER-SERVICE')
  ? configuredApi.replace(/\/$/, '')
  : (import.meta.env.DEV ? developmentApi : productionApi)

export const token = () => localStorage.getItem('mockmate_token')
export const request = async (path, options = {}) => {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  if (token()) headers.Authorization = `Bearer ${token()}`
  const response = await fetch(`${API}${path}`, { ...options, headers })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || 'Something went wrong') }
  return response.status === 204 ? null : response.json()
}
