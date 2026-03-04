import { api } from './client.js'

export interface DimensionPoint {
  x_mm: number
  y_mm: number
}

export interface Dimension {
  id: string
  room_id: string
  type: 'linear' | 'angular' | 'radial' | 'arc_length' | 'chord'
  points: DimensionPoint[]
  style: Record<string, unknown>
  label: string | null
  visible: boolean
  locked: boolean
  lock_scope?: string | null
  ref_a_type?: 'wall' | 'placement' | 'opening' | 'point' | null
  ref_a_id?: string | null
  ref_b_type?: 'wall' | 'placement' | 'opening' | 'point' | null
  ref_b_id?: string | null
  auto_update?: boolean
  created_at: string
  updated_at: string
}

export interface CreateDimensionInput {
  room_id: string
  type: 'linear' | 'angular'
  points: DimensionPoint[]
  style?: {
    unit?: 'mm' | 'cm'
    fontSize?: number
    arrowType?: 'open' | 'closed' | 'none'
    offset_mm?: number
  }
  label?: string | null
}

export const dimensionsApi = {
  list: (roomId: string): Promise<Dimension[]> =>
    api.get<Dimension[]>(`/rooms/${roomId}/dimensions`),

  create: (data: CreateDimensionInput): Promise<Dimension> =>
    api.post<Dimension>('/dimensions', data),

  update: (id: string, data: { label?: string | null; style?: CreateDimensionInput['style'] }): Promise<Dimension> =>
    api.put<Dimension>(`/dimensions/${id}`, data),

  autoGenerate: (roomId: string): Promise<Dimension[]> =>
    api.post<Dimension[]>(`/rooms/${roomId}/dimensions/auto`, {}),

  smartGenerate: (roomId: string): Promise<Dimension[]> =>
    api.post<Dimension[]>(`/rooms/${roomId}/dimensions/smart`, {}),

  autoChain: (roomId: string, data: { wall_id: string; offset_mm?: number }): Promise<{ created: number; dimension_ids: string[] }> =>
    api.post<{ created: number; dimension_ids: string[] }>(`/rooms/${roomId}/dimensions/auto-chain`, data),

  delete: (id: string): Promise<void> =>
    api.delete(`/dimensions/${id}`),

  getElevation: async (roomId: string, wallIndex: number): Promise<string> => {
    const response = await fetch(`/api/v1/rooms/${roomId}/elevation/${wallIndex}`)
    if (!response.ok) {
      throw new Error(`Frontansicht konnte nicht geladen werden (${response.status})`)
    }
    return response.text()
  },
}