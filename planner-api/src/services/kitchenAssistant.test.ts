import { describe, expect, it } from 'vitest'
import { suggestLayouts, type RoomGeometry } from './kitchenAssistant.js'

describe('suggestLayouts', () => {
  it('returns at least einzeiler and l_form for a 4200x3600 room', () => {
    const room: RoomGeometry = {
      ceiling_height_mm: 2600,
      wall_segments: [
        { id: 'w1', x0_mm: 0, y0_mm: 0, x1_mm: 4200, y1_mm: 0 },
        { id: 'w2', x0_mm: 4200, y0_mm: 0, x1_mm: 4200, y1_mm: 3600 },
        { id: 'w3', x0_mm: 4200, y0_mm: 3600, x1_mm: 0, y1_mm: 3600 },
        { id: 'w4', x0_mm: 0, y0_mm: 3600, x1_mm: 0, y1_mm: 0 },
      ],
    }

    const suggestions = suggestLayouts(room)
    const types = suggestions.map((entry) => entry.layout_type)

    expect(types).toContain('einzeiler')
    expect(types).toContain('l_form')
  })
})
