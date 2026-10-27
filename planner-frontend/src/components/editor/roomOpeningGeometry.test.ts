import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildWallSections, createOpeningVisual } from './roomOpeningGeometry.js'

describe('room opening geometry', () => {
  it('leaves a window void above its sill and preserves the lintel and wall beside it', () => {
    const sections = buildWallSections(3000, 2500, [{ wall_id: 'w1', type: 'window', offset_mm: 800, width_mm: 1400, height_mm: 1200, sill_height_mm: 900 }])
    expect(sections).toEqual([
      { offset: 0, width: 800, base: 0, height: 2500 },
      { offset: 800, width: 1400, base: 0, height: 900 },
      { offset: 800, width: 1400, base: 2100, height: 400 },
      { offset: 2200, width: 800, base: 0, height: 2500 },
    ])
    expect(sections.reduce((sum, section) => sum + section.width * section.height, 0)).toBe(3000 * 2500 - 1400 * 1200)
  })

  it('cuts doors to the floor but keeps installation objects from cutting walls', () => {
    const sections = buildWallSections(3000, 2500, [
      { wall_id: 'w1', type: 'door', offset_mm: 0, width_mm: 900, height_mm: 2100 },
      { wall_id: 'w1', type: 'socket', offset_mm: 1200, width_mm: 100, height_mm: 100 },
    ])
    expect(sections).toEqual([{ offset: 0, width: 900, base: 2100, height: 400 }, { offset: 900, width: 2100, base: 0, height: 2500 }])
  })

  it('builds a two-leaf window at its real height above the floor', () => {
    const visual = createOpeningVisual({ wall_id: 'w1', type: 'window', offset_mm: 0, width_mm: 1400, height_mm: 1200, sill_height_mm: 900, leaf_count: 2 })
    const box = new THREE.Box3().setFromObject(visual)
    expect(visual.children).toHaveLength(6)
    expect(box.min.y).toBeCloseTo(0.9)
    expect(box.max.y).toBeCloseTo(2.1)
    expect(box.max.x - box.min.x).toBeCloseTo(1.4)
  })
})
