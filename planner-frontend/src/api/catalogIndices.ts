import { api } from './client.js'

export interface CatalogIndexRecord {
  id: string
  project_id: string
  catalog_id: string
  purchase_index: number
  sales_index: number
  applied_at: string
  applied_by: string
}

export interface CreateCatalogIndexPayload {
  catalog_id: string
  purchase_index: number
  sales_index: number
  applied_by: string
}

function tenantHeaders(tenantId: string) {
  return { 'X-Tenant-Id': tenantId }
}

export const catalogIndicesApi = {
  list: (projectId: string, tenantId: string): Promise<CatalogIndexRecord[]> =>
    api.get<CatalogIndexRecord[]>(`/projects/${projectId}/catalog-indices`, tenantHeaders(tenantId)),

  create: (
    projectId: string,
    tenantId: string,
    payload: CreateCatalogIndexPayload,
  ): Promise<CatalogIndexRecord> =>
    api.post<CatalogIndexRecord>(`/projects/${projectId}/catalog-indices`, payload, tenantHeaders(tenantId)),
}
