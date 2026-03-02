import { api } from './client.js'

export interface SiteSurvey {
  id: string
  project_id: string
  tenant_id: string
  measurements: Record<string, unknown>
  photos: Array<{ url: string; caption?: string; room_id?: string; taken_at?: string }>
  notes: string | null
  synced_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  position: number
  label: string
  checked: boolean
  photo_url: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface InstallationChecklist {
  id: string
  project_id: string
  tenant_id: string
  production_order_id: string | null
  title: string
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  items: ChecklistItem[]
}

export const siteSurveysApi = {
  list: (projectId: string) => api.get<SiteSurvey[]>(`/projects/${projectId}/site-surveys`),
  get: (id: string) => api.get<SiteSurvey>(`/site-surveys/${id}`),
  create: (projectId: string, data: object) => api.post<SiteSurvey>(`/projects/${projectId}/site-surveys`, data),
  update: (id: string, data: object) => api.put<SiteSurvey>(`/site-surveys/${id}`, data),
  delete: (id: string) => api.delete(`/site-surveys/${id}`),
}

export const checklistsApi = {
  list: (projectId: string) => api.get<InstallationChecklist[]>(`/projects/${projectId}/checklists`),
  get: (id: string) => api.get<InstallationChecklist>(`/checklists/${id}`),
  create: (data: object) => api.post<InstallationChecklist>('/checklists', data),
  updateItem: (checklistId: string, itemId: string, data: object) =>
    api.patch<ChecklistItem>(`/checklists/${checklistId}/items/${itemId}`, data),
  delete: (id: string) => api.delete(`/checklists/${id}`),
}
