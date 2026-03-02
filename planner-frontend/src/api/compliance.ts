import { api } from './client.js'

export type GdprScope = 'contacts' | 'projects' | 'leads' | 'documents'
export type RoleName = 'admin' | 'sales' | 'planner' | 'viewer'
export type RoleAction = 'read' | 'write' | 'delete' | 'export'

export interface GdprDeletionRequest {
  id: string
  tenant_id: string
  contact_id: string | null
  user_id: string | null
  requested_at: string
  completed_at: string | null
  performed_by: string
  scope_json: GdprScope[]
  result_json: {
    deleted?: Record<string, number>
    anonymized?: Record<string, number>
  }
}

export interface RolePermission {
  id: string
  tenant_id: string
  role: RoleName
  resource: string
  action: RoleAction
  branch_id: string | null
  created_at: string
}

export interface SlaSnapshot {
  id: string
  tenant_id: string | null
  endpoint: string
  p50_ms: number
  p95_ms: number
  uptime_pct: number
  sample_size: number
  recorded_at: string
}

export const complianceApi = {
  createDeletionRequest: (tenantId: string, data: {
    contact_id?: string
    user_id?: string
    performed_by: string
    scope: GdprScope[]
  }) => api.post<GdprDeletionRequest>('/gdpr/deletion-requests', data, { 'X-Tenant-Id': tenantId }),

  listDeletionRequests: (tenantId: string) =>
    api.get<GdprDeletionRequest[]>('/gdpr/deletion-requests', { 'X-Tenant-Id': tenantId }),

  listRolePermissions: (tenantId: string) =>
    api.get<RolePermission[]>('/role-permissions', { 'X-Tenant-Id': tenantId }),

  createRolePermission: (tenantId: string, data: {
    role: RoleName
    resource: string
    action: RoleAction
    branch_id?: string | null
  }) => api.post<RolePermission>('/role-permissions', data, { 'X-Tenant-Id': tenantId }),

  deleteRolePermission: (tenantId: string, id: string) =>
    api.delete(`/role-permissions/${id}`, { 'X-Tenant-Id': tenantId }),

  listSlaSnapshots: (tenantId: string, limit = 20) =>
    api.get<SlaSnapshot[]>(`/sla-snapshots?limit=${limit}`, { 'X-Tenant-Id': tenantId }),
}