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

/* ---------- GET cache (stale-while-revalidate + ETag/304) ----------
 * Kwenye mtandao wa polepole (latency kubwa), tunahifadhi jibu la mwisho la
 * kila GET. Tunatuma `If-None-Match`; server ikirudisha 304 (data haijabadilika)
 * tunatumia cache, hakuna JSON kubwa ya kuhamisha. `api.cached()` inaruhusu page
 * ionyeshe data ya mwisho MARA MOJA kabla fetch mpya haijaisha. */
interface CacheEntry {
  etag: string
  data: unknown
}
const memCache = new Map<string, CacheEntry>()
const CACHE_PREFIX = 'hs:cache:'
const MAX_CACHE_BYTES = 300_000

function readCache(path: string): CacheEntry | undefined {
  const hit = memCache.get(path)
  if (hit) return hit
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + path)
    if (raw) {
      const parsed = JSON.parse(raw) as CacheEntry
      memCache.set(path, parsed)
      return parsed
    }
  } catch {
    /* localStorage haipatikani / JSON mbaya */
  }
  return undefined
}

function writeCache(path: string, etag: string, data: unknown): void {
  const entry: CacheEntry = { etag, data }
  memCache.set(path, entry)
  try {
    const serialized = JSON.stringify(entry)
    if (serialized.length <= MAX_CACHE_BYTES) localStorage.setItem(CACHE_PREFIX + path, serialized)
  } catch {
    /* quota exceeded — memory cache bado inatosha */
  }
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

  const cached = method === 'GET' ? readCache(path) : undefined
  if (cached) headers['If-None-Match'] = cached.etag

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
    // Mtandao umeshindwa: rudisha cache kama tunayo (bora kuliko kukwama).
    if (cached) return cached.data as T
    throw new ApiError('The server is not reachable. Check that the backend is running.', 0, 'network_error')
  }

  // 304 Not Modified: data haijabadilika, tumia cache (hakuna body).
  if (response.status === 304 && cached) return cached.data as T
  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const { detail, code } = readDetail(payload, `Request failed (${response.status}).`)
    throw new ApiError(detail, response.status, code)
  }

  if (method === 'GET') {
    const etag = response.headers.get('ETag')
    if (etag) writeCache(path, etag, payload)
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
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  del: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
  upload: apiUpload,
  /** Jibu la mwisho lililohifadhiwa la GET hii (au null). Kwa seed ya papo hapo:
   *  `useState(() => api.cached<T>(path))` — page inaonyesha data kabla fetch. */
  cached: <T>(path: string): T | null => (readCache(path)?.data as T | undefined) ?? null,
}
