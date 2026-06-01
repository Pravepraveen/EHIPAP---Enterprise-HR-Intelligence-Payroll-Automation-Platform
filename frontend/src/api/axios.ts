import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getApiBaseUrl } from '../config/api'

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout']
const READ_CACHE_PREFIX = 'ehipap_read_cache:'
const OFFLINE_ACTION_QUEUE_KEY = 'offline_action_queue'
const OFFLINE_STATUS_EVENT = 'ehipap:offline-status'

type ApiRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRedirect?: boolean
  skipAuthRefresh?: boolean
}

type CachedResponse = {
  data: unknown
  status: number
  statusText: string
  headers: Record<string, unknown>
  cachedAt: string
}

type QueuedAction = {
  id: string
  method: string
  url: string
  params?: unknown
  data?: unknown
  queuedAt: string
}

function isAuthRequest(url?: string): boolean {
  if (!url) return false
  return AUTH_PATHS.some((p) => url.includes(p))
}

function getMethod(config?: InternalAxiosRequestConfig): string {
  return (config?.method || 'get').toLowerCase()
}

function stableStringify(value: unknown): string {
  if (value === undefined) return ''
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(',')}}`
}

function makeCacheKey(config: InternalAxiosRequestConfig): string {
  return `${READ_CACHE_PREFIX}${getMethod(config)}:${config.url || ''}:${stableStringify(config.params)}`
}

function cacheGetResponse(response: AxiosResponse) {
  if (getMethod(response.config) !== 'get') return
  if (response.status < 200 || response.status >= 300) return

  try {
    const cached: CachedResponse = {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, unknown>,
      cachedAt: new Date().toISOString(),
    }
    localStorage.setItem(makeCacheKey(response.config), JSON.stringify(cached))
  } catch (error) {
    console.warn('Unable to cache GET response for offline mode:', error)
  }
}

function readCachedResponse(config: InternalAxiosRequestConfig): CachedResponse | null {
  try {
    const raw = localStorage.getItem(makeCacheKey(config))
    return raw ? JSON.parse(raw) as CachedResponse : null
  } catch {
    return null
  }
}

function parseRequestData(data: unknown): unknown {
  if (typeof data !== 'string') return data

  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

function readActionQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ACTION_QUEUE_KEY)
    return raw ? JSON.parse(raw) as QueuedAction[] : []
  } catch {
    return []
  }
}

function enqueueOfflineAction(config: InternalAxiosRequestConfig): QueuedAction {
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    method: getMethod(config).toUpperCase(),
    url: config.url || '',
    params: config.params,
    data: parseRequestData(config.data),
    queuedAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(OFFLINE_ACTION_QUEUE_KEY, JSON.stringify([...readActionQueue(), action]))
  } catch (error) {
    console.warn('Unable to persist offline action queue:', error)
  }

  return action
}

function emitOfflineStatus(offline: boolean, reason?: string) {
  window.dispatchEvent(new CustomEvent(OFFLINE_STATUS_EVENT, {
    detail: { offline, reason },
  }))
}

function isNetworkFailure(error: AxiosError): boolean {
  if (error.response) return false
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('timeout')
  )
}

function fallbackDataFor(config: InternalAxiosRequestConfig): unknown {
  const url = config.url || ''

  if (url.includes('/notifications/count')) return { count: 0 }
  if (url.includes('/analytics/headcount')) return { byDepartment: [], byEmploymentType: [], byGender: [] }
  if (url.includes('/analytics/dashboard')) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      openJobs: 0,
      totalCandidates: 0,
      pendingLeaves: 0,
      employeesByDepartment: [],
      payrollTrend: [],
    }
  }
  if (url.includes('/payroll/stats')) {
    return { totalRuns: 0, processedRuns: 0, totalPaid: 0 }
  }
  if (url.includes('/employees/stats')) {
    return { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 }
  }
  if (url.includes('/employees') && config.params && !url.includes('/employees/')) {
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: Number((config.params as any).size || 0) }
  }
  if (url.includes('/payroll/my/salary')) return null

  return []
}

function makeOfflineResponse(
  config: InternalAxiosRequestConfig,
  data: unknown,
  source: 'cache' | 'fallback' | 'queue',
  request?: unknown
): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: source === 'cache' ? 'OK (offline cache)' : source === 'queue' ? 'OK (offline queued)' : 'OK (offline fallback)',
    headers: { 'x-ehipap-offline': source },
    config,
    request,
  }
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { accessToken, refreshToken: newRefresh } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefresh ?? refreshToken)
      return accessToken as string
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

function forceLogout() {
  const hadSession =
    Boolean(localStorage.getItem('accessToken')) || Boolean(localStorage.getItem('refreshToken'))
  if (!hadSession) return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  if (!window.location.hash.startsWith('#/login')) {
    window.location.replace('#/login')
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    cacheGetResponse(response)
    emitOfflineStatus(false, 'backend-online')
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ApiRequestConfig

    if (!originalRequest) return Promise.reject(error)

    const method = getMethod(originalRequest)
    const writeMethods = ['post', 'put', 'patch', 'delete']

    if (isNetworkFailure(error) && !isAuthRequest(originalRequest.url)) {
      emitOfflineStatus(true, 'backend-unreachable')

      if (method === 'get') {
        const cached = readCachedResponse(originalRequest)
        if (cached) {
          return makeOfflineResponse(originalRequest, cached.data, 'cache', error.request)
        }

        return makeOfflineResponse(originalRequest, fallbackDataFor(originalRequest), 'fallback', error.request)
      }

      if (writeMethods.includes(method)) {
        const queued = enqueueOfflineAction(originalRequest)
        return makeOfflineResponse(originalRequest, { queued: true, offline: true, action: queued }, 'queue', error.request)
      }
    }

    const status = error.response?.status

    if (status !== 401) return Promise.reject(error)

    if (isAuthRequest(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (originalRequest.skipAuthRedirect || originalRequest.skipAuthRefresh) {
      return Promise.reject(error)
    }

    const hasToken = Boolean(localStorage.getItem('accessToken'))
    if (!hasToken) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const newToken = await refreshAccessToken()

    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    }

    forceLogout()
    return Promise.reject(error)
  }
)

export default api
