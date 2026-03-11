import { tenantScopedHeaders } from './runtimeContext.js'
const BASE_URL = '/api/v1'
const DEMO_MODE_STORAGE_KEY = 'okp-demo-mode'

type ApiError = { error: string; message: string }

async function request<T>(path: string, options?: RequestInit, extraHeaders?: Record<string, string>): Promise<T> {
  const withTenant = tenantScopedHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...withTenant, ...extraHeaders, ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: 'UNKNOWN', message: res.statusText }))
    throw new Error(err.message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) => request<T>(path, undefined, headers),
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, headers),
  put: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, headers),
  patch: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, headers),
  delete: (path: string, headers?: Record<string, string>) =>
    request<void>(path, { method: 'DELETE' }, headers),
}

function isExplicitDemoModeEnabled(): boolean {
  const envEnabled = typeof import.meta !== 'undefined'
    && Boolean((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ENABLE_DEMO_FALLBACK === 'true')

  if (envEnabled) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function shouldUseDemoFallback(error: unknown): boolean {
  if (!isExplicitDemoModeEnabled()) {
    return false
  }

  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('database_url') ||
    message.includes('prisma') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('internal server error')
  )
}
