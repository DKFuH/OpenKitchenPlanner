import type { Opening as SharedOpening } from '@shared/types'
import { api } from './client.js'
import { saveOpenings as saveDemoOpenings } from './demoBackend.js'
import { shouldUseDemoFallback } from './client.js'

type OpeningType = 'door' | 'window' | 'pass-through' | 'radiator' | 'socket' | 'switch' | 'niche' | 'pipe' | 'custom'

export interface Opening extends Omit<SharedOpening, 'type' | 'wall_offset_depth_mm'> {
  type: OpeningType
  wall_offset_depth_mm?: number | null
}

function normalizeOpeningType(type: SharedOpening['type']): OpeningType {
  return type ?? 'door'
}

function normalizeOpening(opening: SharedOpening): Opening {
  return {
    ...opening,
    type: normalizeOpeningType(opening.type),
  }
}

function normalizeOpenings(openings: SharedOpening[]): Opening[] {
  return openings.map(normalizeOpening)
}

export const openingsApi = {
  list: (roomId: string): Promise<Opening[]> =>
    api.get<SharedOpening[]>(`/rooms/${roomId}/openings`).then(normalizeOpenings),

  save: async (roomId: string, openings: Opening[]): Promise<Opening[]> => {
    try {
      const saved = await api.put<SharedOpening[]>(`/rooms/${roomId}/openings`, { openings })
      return normalizeOpenings(saved)
    } catch (error) {
      if (shouldUseDemoFallback(error)) return normalizeOpenings(saveDemoOpenings(roomId, openings))
      throw error
    }
  },

  create: (roomId: string, opening: Omit<Opening, 'id'>): Promise<Opening> =>
    api.post<SharedOpening>(`/rooms/${roomId}/openings`, opening).then(normalizeOpening),

  delete: (roomId: string, openingId: string): Promise<void> =>
    api.delete(`/rooms/${roomId}/openings/${openingId}`),
}
