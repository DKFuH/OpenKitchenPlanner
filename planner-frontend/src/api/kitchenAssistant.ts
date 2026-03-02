import { api } from './client.js'

export interface MacroPosition {
  wall_id: string | null
  offset_mm: number
  article_id: string
  width_mm: number
  depth_mm: number
  height_mm: number
}

export interface CatalogMacro {
  id: string
  name: string
  description?: string
  thumbnail?: string
  positions: MacroPosition[]
}

export interface LayoutSuggestion {
  id: string
  layout_type: 'einzeiler' | 'zweizeiler' | 'l_form' | 'u_form' | 'insel'
  positions: MacroPosition[]
  score: number
  reason?: string
  applied: boolean
}

export interface CatalogHierarchy {
  collections: string[]
  families: string[]
  style_tags: string[]
}

export interface CatalogArticleSearchResult {
  total: number
  articles: Array<{
    id: string
    sku: string
    name: string
    collection?: string | null
    family?: string | null
    style_tag?: string | null
    is_favorite?: boolean
    usage_count?: number
    prices?: Array<{ list_net?: number }>
  }>
}

export const kitchenAssistantApi = {
  getHierarchy: (): Promise<CatalogHierarchy> =>
    api.get<CatalogHierarchy>('/catalog/hierarchy'),

  searchArticles: (params: {
    collection?: string
    family?: string
    style_tag?: string
    search?: string
    only_favorites?: boolean
    limit?: number
    offset?: number
  }): Promise<CatalogArticleSearchResult> => {
    const query = new URLSearchParams()
    if (params.collection) query.set('collection', params.collection)
    if (params.family) query.set('family', params.family)
    if (params.style_tag) query.set('style_tag', params.style_tag)
    if (params.search) query.set('search', params.search)
    if (params.only_favorites) query.set('only_favorites', 'true')
    if (params.limit != null) query.set('limit', String(params.limit))
    if (params.offset != null) query.set('offset', String(params.offset))

    const qs = query.toString()
    return api.get<CatalogArticleSearchResult>(`/catalog/articles${qs ? `?${qs}` : ''}`)
  },

  toggleFavorite: (articleId: string, isFavorite: boolean) =>
    api.patch(`/catalog/articles/${articleId}/favorite`, { is_favorite: isFavorite }),

  listMacros: (): Promise<CatalogMacro[]> =>
    api.get<CatalogMacro[]>('/catalog-macros'),

  createMacro: (data: Omit<CatalogMacro, 'id'> & { created_by: string }) =>
    api.post<CatalogMacro>('/catalog-macros', data),

  deleteMacro: (id: string) =>
    api.delete(`/catalog-macros/${id}`),

  suggestLayouts: (roomId: string): Promise<{ suggestions: LayoutSuggestion[]; message?: string }> =>
    api.post<{ suggestions: LayoutSuggestion[]; message?: string }>(`/rooms/${roomId}/suggest-layout`, {}),

  applyLayout: (suggestionId: string) =>
    api.post<{ applied: boolean; placements_added: number }>(`/kitchen-layout-suggestions/${suggestionId}/apply`, {}),

  listSuggestions: (roomId: string): Promise<LayoutSuggestion[]> =>
    api.get<LayoutSuggestion[]>(`/rooms/${roomId}/layout-suggestions`),
}
