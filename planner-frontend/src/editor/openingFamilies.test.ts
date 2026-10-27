import { describe, expect, it } from 'vitest'
import { applyOpeningFamily, defaultDoorOpening } from './openingFamilies.js'

describe('openingFamilies', () => {
  it('creates a centered DIN door with planning metadata', () => {
    expect(defaultDoorOpening('wall-1', 3000, 'opening-1')).toMatchObject({
      family_id: 'door-single-standard',
      variant: 'Drehflügel',
      width_mm: 885,
      height_mm: 1985,
      offset_mm: 1058,
      hinge_side: 'left',
      opening_direction: 'inward',
      leaf_count: 1,
    })
  })

  it('applies a two-leaf window family while preserving placement identity', () => {
    const updated = applyOpeningFamily({
      id: 'opening-1',
      wall_id: 'wall-1',
      type: 'door',
      offset_mm: 250,
      width_mm: 900,
    }, 'window-tilt-turn-double')

    expect(updated).toMatchObject({
      id: 'opening-1',
      wall_id: 'wall-1',
      offset_mm: 250,
      type: 'window',
      width_mm: 1400,
      height_mm: 1200,
      sill_height_mm: 900,
      leaf_count: 2,
      variant: 'Dreh-Kipp',
    })
  })
})
