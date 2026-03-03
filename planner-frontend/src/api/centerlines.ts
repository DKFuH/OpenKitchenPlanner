import { api } from './client.js'

export interface Centerline {
  id: string
  room_id: string
  label: string | null
  x0_mm: number
  y0_mm: number
  x1_mm: number
  y1_mm: number
  style: Record<string, unknown>
  ref_type: 'placement' | 'opening' | null
  ref_id: string | null
  created_at: string
}

export const centerlinesApi = {
  list: (roomId: string): Promise<Centerline[]> =>
    api.get<Centerline[]>(`/rooms/${roomId}/centerlines`),
}
