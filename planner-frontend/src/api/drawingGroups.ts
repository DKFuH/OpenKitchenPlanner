import { api } from './client.js'

const TENANT_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000001'

export type DrawingGroupKind = 'selection_set' | 'drawing_group' | 'component' | 'annotation_group'
export type DrawingGroupMemberType = 'placement' | 'opening' | 'dimension' | 'centerline'

export interface DrawingGroupMember {
  entity_type: DrawingGroupMemberType
  entity_id: string
  room_id?: string
}

export interface DrawingGroup {
  id: string
  tenant_id: string
  project_id: string
  name: string
  kind: DrawingGroupKind
  members_json: DrawingGroupMember[]
  config_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DrawingGroupConfigPatch {
  visible?: boolean
  locked?: boolean
  lock_scope?: string | null
}

export interface DrawingGroupTransformInput {
  translate?: { x_mm: number; y_mm: number }
  rotation_deg?: number
  pivot?: { x_mm: number; y_mm: number }
}

export interface DrawingGroupOperationResult {
  updated: {
    placements: number
    openings: number
    dimensions: number
    centerlines: number
  }
  skipped: number
  skipped_reasons: string[]
  blocked: boolean
}

export const drawingGroupsApi = {
  list: (projectId: string): Promise<DrawingGroup[]> =>
    api.get<DrawingGroup[]>(
      `/projects/${projectId}/drawing-groups`,
      { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER },
    ),

  create: (projectId: string, payload: {
    name: string
    kind: DrawingGroupKind
    members_json: DrawingGroupMember[]
    config_json?: Record<string, unknown>
  }): Promise<DrawingGroup> =>
    api.post<DrawingGroup>(
      `/projects/${projectId}/drawing-groups`,
      payload,
      { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER },
    ),

  update: (groupId: string, payload: {
    name?: string
    kind?: DrawingGroupKind
    members_json?: DrawingGroupMember[]
    config_json?: Record<string, unknown>
    sync_members?: boolean
  }): Promise<DrawingGroup & { member_sync?: DrawingGroupOperationResult }> =>
    api.patch<DrawingGroup & { member_sync?: DrawingGroupOperationResult }>(
      `/drawing-groups/${groupId}`,
      payload,
      { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER },
    ),

  remove: (groupId: string): Promise<void> =>
    api.delete(`/drawing-groups/${groupId}`, { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER }),

  applyTransform: (groupId: string, payload: DrawingGroupTransformInput): Promise<DrawingGroupOperationResult> =>
    api.post<DrawingGroupOperationResult>(
      `/drawing-groups/${groupId}/apply-transform`,
      payload,
      { 'X-Tenant-Id': TENANT_ID_PLACEHOLDER },
    ),
}
