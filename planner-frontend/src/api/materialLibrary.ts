import { api } from './client.js'
import type {
  MaterialAssignmentPayload,
  MaterialAssignmentsResponse,
  MaterialCategory,
  MaterialLibraryItem,
} from '../plugins/materials/index.js'

export type LibrarySort = 'updated' | 'name' | 'favorites'

export interface LibraryFolder {
  id: string
  tenant_id: string
  kind: 'asset' | 'material'
  name: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface LibrarySavedFilter {
  id: string
  tenant_id: string
  kind: 'asset' | 'material'
  name: string
  saved_filter_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface MaterialListParams {
  q?: string
  category?: MaterialCategory
  favorite_only?: boolean
  folder_id?: string
  collection?: string
  sort?: LibrarySort
}

interface MaterialWriteFields {
  name: string
  category: MaterialCategory
  favorite?: boolean
  folder_id?: string | null
  collection?: string | null
  texture_url?: string | null
  preview_url?: string | null
  scale_x_mm?: number | null
  scale_y_mm?: number | null
  rotation_deg?: number
  roughness?: number | null
  metallic?: number | null
  config_json?: Record<string, unknown>
}

export type MaterialCreatePayload = MaterialWriteFields

export type MaterialPatchPayload = Partial<MaterialWriteFields>

export const materialLibraryApi = {
  list: (params?: MaterialListParams): Promise<MaterialLibraryItem[]> => {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.category) search.set('category', params.category)
    if (params?.favorite_only) search.set('favorite_only', 'true')
    if (params?.folder_id) search.set('folder_id', params.folder_id)
    if (params?.collection) search.set('collection', params.collection)
    if (params?.sort) search.set('sort', params.sort)
    const qs = search.toString()
    return api.get<MaterialLibraryItem[]>(`/tenant/materials${qs ? `?${qs}` : ''}`)
  },

  listFolders: (params?: { parent_id?: string }): Promise<LibraryFolder[]> => {
    const search = new URLSearchParams()
    if (params?.parent_id) search.set('parent_id', params.parent_id)
    const qs = search.toString()
    return api.get<LibraryFolder[]>(`/tenant/materials/folders${qs ? `?${qs}` : ''}`)
  },

  createFolder: (payload: { name: string; parent_id?: string | null }): Promise<LibraryFolder> =>
    api.post<LibraryFolder>('/tenant/materials/folders', payload),

  patchFolder: (id: string, payload: { name?: string; parent_id?: string | null }): Promise<LibraryFolder> =>
    api.patch<LibraryFolder>(`/tenant/materials/folders/${id}`, payload),

  removeFolder: (id: string): Promise<void> =>
    api.delete(`/tenant/materials/folders/${id}`),

  listSavedFilters: (): Promise<LibrarySavedFilter[]> =>
    api.get<LibrarySavedFilter[]>('/tenant/materials/saved-filters'),

  createSavedFilter: (payload: { name: string; saved_filter_json: Record<string, unknown> }): Promise<LibrarySavedFilter> =>
    api.post<LibrarySavedFilter>('/tenant/materials/saved-filters', payload),

  removeSavedFilter: (id: string): Promise<void> =>
    api.delete(`/tenant/materials/saved-filters/${id}`),

  create: (payload: MaterialCreatePayload): Promise<MaterialLibraryItem> =>
    api.post<MaterialLibraryItem>('/tenant/materials', payload),

  patch: (id: string, payload: MaterialPatchPayload): Promise<MaterialLibraryItem> =>
    api.patch<MaterialLibraryItem>(`/tenant/materials/${id}`, payload),

  remove: (id: string): Promise<void> =>
    api.delete(`/tenant/materials/${id}`),

  assign: (projectId: string, payload: MaterialAssignmentPayload): Promise<MaterialAssignmentsResponse> =>
    api.post<MaterialAssignmentsResponse>(`/projects/${projectId}/material-assignments`, payload),
}
