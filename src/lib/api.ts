import { auth } from './firebase'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(
  /\/$/,
  '',
)

/** Umbo la error linalotoka backend: `{ detail, code }`. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Endpoints kama `/subscriptions/plans` hazihitaji kuwa umeingia. */
  auth?: boolean
  signal?: AbortSignal
}

async function bearerToken(): Promise<string> {
  const current = auth.currentUser
  if (!current) throw new ApiError('You are not signed in.', 401, 'not_signed_in')
  return current.getIdToken()
}

/** FastAPI validation errors huja kama array ya `{loc, msg}`. */
function readDetail(payload: unknown, fallback: string): { detail: string; code: string } {
  if (typeof payload !== 'object' || payload === null) return { detail: fallback, code: 'error' }

  const record = payload as Record<string, unknown>
  const code = typeof record.code === 'string' ? record.code : 'error'
  const detail = record.detail

  if (typeof detail === 'string') return { detail, code }

  if (Array.isArray(detail)) {
    const first = detail[0] as Record<string, unknown> | undefined
    const msg = first && typeof first.msg === 'string' ? first.msg : fallback
    return { detail: msg.replace(/^Value error,\s*/, ''), code: 'validation_error' }
  }

  return { detail: fallback, code }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth: needsAuth = true, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (needsAuth) headers.Authorization = `Bearer ${await bearerToken()}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('The server is not reachable. Check that the backend is running.', 0, 'network_error')
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const { detail, code } = readDetail(payload, `Request failed (${response.status}).`)
    throw new ApiError(detail, response.status, code)
  }

  return payload as T
}

/**
 * Upload ya faili (multipart). Tofauti na `apiFetch`, hapa hatuseti
 * `Content-Type`, browser inaiweka yenyewe pamoja na boundary sahihi.
 */
export async function apiUpload<T>(
  path: string,
  form: FormData,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${await bearerToken()}`,
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: form,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('The server is not reachable. Check that the backend is running.', 0, 'network_error')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const { detail, code } = readDetail(payload, `Upload failed (${response.status}).`)
    throw new ApiError(detail, response.status, code)
  }
  return payload as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  del: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
  upload: apiUpload,
}
