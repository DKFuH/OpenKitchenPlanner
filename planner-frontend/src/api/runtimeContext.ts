const TENANT_HEADER = 'X-Tenant-Id'
const TENANT_META_NAME = 'okp-tenant-id'
const TENANT_STORAGE_KEY = 'yakds:tenant-id'
const TENANT_QUERY_PARAM = 'tenantId'
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
const UUID_V4_OR_V1_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface YakdsRuntimeContext {
  tenantId?: string
}

declare global {
  interface Window {
    __YAKDS_RUNTIME_CONTEXT__?: YakdsRuntimeContext
  }
}

function normalizeTenantId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!UUID_V4_OR_V1_PATTERN.test(trimmed)) {
    return null
  }

  return trimmed
}

export function getRuntimeTenantId(): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT_ID

  const fromRuntime = normalizeTenantId(window.__YAKDS_RUNTIME_CONTEXT__?.tenantId)
  if (fromRuntime) {
    return fromRuntime
  }

  const fromStorage = (() => {
    try {
      return normalizeTenantId(window.localStorage?.getItem(TENANT_STORAGE_KEY))
    } catch {
      return null
    }
  })()
  if (fromStorage) {
    return fromStorage
  }

  const fromQuery = (() => {
    try {
      return normalizeTenantId(new URLSearchParams(window.location.search).get(TENANT_QUERY_PARAM))
    } catch {
      return null
    }
  })()
  if (fromQuery) {
    return fromQuery
  }

  const fromMeta = typeof document !== 'undefined'
    ? normalizeTenantId(document.querySelector(`meta[name="${TENANT_META_NAME}"]`)?.getAttribute('content'))
    : null

  if (fromMeta) {
    return fromMeta
  }

  return DEFAULT_TENANT_ID
}

export function tenantScopedHeaders(headers?: Record<string, string>): Record<string, string> {
  const tenantId = getRuntimeTenantId()
  return {
    ...(headers ?? {}),
    [TENANT_HEADER]: tenantId,
  }
}
