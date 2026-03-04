import { api } from './client.js'
import type { AssetCategory, AssetLibraryItem } from '../plugins/assetLibrary/index.js'

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

interface AssetListParams {
  q?: string
  category?: AssetCategory
  favorite_only?: boolean
  folder_id?: string
  collection?: string
  sort?: LibrarySort
}

interface AssetImportPayload {
  name?: string
  category: AssetCategory
  favorite?: boolean
  folder_id?: string | null
  collection?: string | null
  tags: string[]
  file_name: string
  file_base64: string
}

interface AssetPatchPayload {
  name?: string
  category?: AssetCategory
  favorite?: boolean
  folder_id?: string | null
  collection?: string | null
  tags?: string[]
  preview_url?: string | null
}

export const assetLibraryApi = {
  list: (params?: AssetListParams): Promise<AssetLibraryItem[]> => {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.category) search.set('category', params.category)
    if (params?.favorite_only) search.set('favorite_only', 'true')
    if (params?.folder_id) search.set('folder_id', params.folder_id)
    if (params?.collection) search.set('collection', params.collection)
    if (params?.sort) search.set('sort', params.sort)
    const qs = search.toString()
    return api.get<AssetLibraryItem[]>(`/tenant/assets${qs ? `?${qs}` : ''}`)
  },

  listFolders: (params?: { parent_id?: string }): Promise<LibraryFolder[]> => {
    const search = new URLSearchParams()
    if (params?.parent_id) search.set('parent_id', params.parent_id)
    const qs = search.toString()
    return api.get<LibraryFolder[]>(`/tenant/assets/folders${qs ? `?${qs}` : ''}`)
  },

  createFolder: (payload: { name: string; parent_id?: string | null }): Promise<LibraryFolder> =>
    api.post<LibraryFolder>('/tenant/assets/folders', payload),

  patchFolder: (id: string, payload: { name?: string; parent_id?: string | null }): Promise<LibraryFolder> =>
    api.patch<LibraryFolder>(`/tenant/assets/folders/${id}`, payload),

  removeFolder: (id: string): Promise<void> =>
    api.delete(`/tenant/assets/folders/${id}`),

  listSavedFilters: (): Promise<LibrarySavedFilter[]> =>
    api.get<LibrarySavedFilter[]>('/tenant/assets/saved-filters'),

  createSavedFilter: (payload: { name: string; saved_filter_json: Record<string, unknown> }): Promise<LibrarySavedFilter> =>
    api.post<LibrarySavedFilter>('/tenant/assets/saved-filters', payload),

  removeSavedFilter: (id: string): Promise<void> =>
    api.delete(`/tenant/assets/saved-filters/${id}`),

  importAsset: (payload: AssetImportPayload): Promise<AssetLibraryItem> =>
    api.post<AssetLibraryItem>('/tenant/assets/import', payload),

  patch: (id: string, payload: AssetPatchPayload): Promise<AssetLibraryItem> =>
    api.patch<AssetLibraryItem>(`/tenant/assets/${id}`, payload),

  remove: (id: string): Promise<void> =>
    api.delete(`/tenant/assets/${id}`),
}
