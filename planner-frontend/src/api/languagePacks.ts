import { api } from './client.js'

export type LanguagePack = {
  id: string
  tenant_id: string | null
  locale_code: string
  name: string
  scope: 'system' | 'tenant'
  messages_json: Record<string, unknown>
  enabled: boolean
  created_at: string
  updated_at: string
}

export type LanguagePackCreateBody = {
  locale_code: string
  name: string
  scope?: 'tenant'
  messages_json: Record<string, unknown>
  enabled?: boolean
}

export type LanguagePackPatchBody = {
  name?: string
  messages_json?: Record<string, unknown>
  enabled?: boolean
}

export type LanguagePackResolvedResponse = {
  items: LanguagePack[]
  locale_code: string
  resolved_messages: Record<string, unknown>
}

export const languagePacksApi = {
  list: (params?: { locale_code?: string; enabled?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.locale_code) query.set('locale_code', params.locale_code)
    if (params?.enabled !== undefined) query.set('enabled', String(params.enabled))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return api.get<LanguagePack[]>(`/language-packs${suffix}`)
  },

  listResolved: (localeCode: string, enabled = true) => {
    const query = new URLSearchParams()
    query.set('locale_code', localeCode)
    query.set('resolved', 'true')
    query.set('enabled', String(enabled))
    return api.get<LanguagePackResolvedResponse>(`/language-packs?${query.toString()}`)
  },

  create: (payload: LanguagePackCreateBody) => api.post<LanguagePack>('/language-packs', payload),

  patch: (id: string, payload: LanguagePackPatchBody) => api.patch<LanguagePack>(`/language-packs/${id}`, payload),

  remove: (id: string) => api.delete(`/language-packs/${id}`),
}
