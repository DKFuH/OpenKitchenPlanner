import * as THREE from 'three'

export interface RoomOpeningGeometry {
  wall_id: string
  offset_mm: number
  width_mm: number
  type?: string
  height_mm?: number
  sill_height_mm?: number
  leaf_count?: number
  variant?: string
  muntin_rows?: number
  glazing?: 'none' | 'full' | 'upper'
  panel_count?: number
  materials?: { frame_color?: string; leaf_color?: string; glass_color?: string; sill_color?: string }
}

export function isWallOpening(opening: RoomOpeningGeometry): boolean {
  return !opening.type || ['door', 'window', 'pass-through'].includes(opening.type)
}

export function openingVerticalBounds(opening: RoomOpeningGeometry) {
  const base = opening.type === 'window' ? opening.sill_height_mm ?? 900 : 0
  return { base, height: opening.height_mm ?? (opening.type === 'window' ? 1200 : 2100) }
}

// Split each horizontal span into solid rectangles around its opening intervals.
export function buildWallSections(length: number, height: number, openings: RoomOpeningGeometry[]) {
  const cuts = openings.filter(isWallOpening).map(opening => {
    const vertical = openingVerticalBounds(opening)
    return {
      start: Math.max(0, opening.offset_mm), end: Math.min(length, opening.offset_mm + opening.width_mm),
      base: Math.max(0, vertical.base), top: Math.min(height, vertical.base + vertical.height),
    }
  }).filter(cut => cut.end > cut.start && cut.top > cut.base)
  const edges = [...new Set([0, length, ...cuts.flatMap(cut => [cut.start, cut.end])])].sort((a, b) => a - b)
  const sections: Array<{ offset: number; width: number; base: number; height: number }> = []
  for (let i = 0; i < edges.length - 1; i++) {
    const start = edges[i], end = edges[i + 1]
    let base = 0
    const intervals = cuts.filter(cut => cut.start < end && cut.end > start).sort((a, b) => a.base - b.base)
    for (const cut of intervals) {
      if (cut.base > base) sections.push({ offset: start, width: end - start, base, height: cut.base - base })
      base = Math.max(base, cut.top)
    }
    if (base < height) sections.push({ offset: start, width: end - start, base, height: height - base })
  }
  return sections
}

export function createOpeningVisual(opening: RoomOpeningGeometry): THREE.Group {
  const group = new THREE.Group()
  if (!isWallOpening(opening) || opening.type === 'pass-through') return group
  const { base, height } = openingVerticalBounds(opening)
  const w = opening.width_mm / 1000, h = height / 1000, y = base / 1000
  const frame = Math.min(0.05, w / 8, h / 8)
  const window = opening.type === 'window'
  const frameMaterial = new THREE.MeshStandardMaterial({ color: opening.materials?.frame_color ?? (window ? 0xf1f5f9 : 0xcbb89a), roughness: 0.7 })
  frameMaterial.name = 'frame'
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: window || opening.glazing === 'full' ? opening.materials?.glass_color ?? 0xb9dce8 : opening.materials?.leaf_color ?? 0xdecbaa,
    transparent: window || opening.glazing === 'full',
    opacity: window || opening.glazing === 'full' ? 0.3 : 1,
    roughness: window ? 0.15 : 0.75,
    side: THREE.DoubleSide,
  })
  leafMaterial.name = window || opening.glazing === 'full' ? 'glass' : 'leaf'
  const addBox = (x: number, cy: number, width: number, ch: number, depth: number, material: THREE.Material, name = 'frame') => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, ch, depth), material)
    mesh.name = name
    mesh.position.set(x, cy, 0)
    group.add(mesh)
  }
  addBox(-w / 2 + frame / 2, y + h / 2, frame, h, 0.12, frameMaterial)
  addBox(w / 2 - frame / 2, y + h / 2, frame, h, 0.12, frameMaterial)
  addBox(0, y + h - frame / 2, w, frame, 0.12, frameMaterial)
  if (window) addBox(0, y + frame / 2, w, frame, 0.12, frameMaterial)
  addBox(0, y + h / 2, w - 2 * frame, h - 2 * frame, 0.02, leafMaterial, window || opening.glazing === 'full' ? 'glass' : 'leaf')
  const leaves = Math.max(1, Math.min(4, opening.leaf_count ?? 1))
  for (let index = 1; index < leaves; index++) addBox(-w / 2 + w * index / leaves, y + h / 2, frame, h - 2 * frame, 0.1, frameMaterial)
  const rows = Math.max(0, Math.min(6, opening.muntin_rows ?? 0))
  for (let index = 1; index <= rows; index++) addBox(0, y + h * index / (rows + 1), w - 2 * frame, frame * 0.6, 0.06, frameMaterial)
  if (!window && opening.glazing === 'upper') {
    const glass = new THREE.MeshStandardMaterial({ color: opening.materials?.glass_color ?? 0xb9dce8, transparent: true, opacity: 0.6 })
    addBox(0, y + h * 0.72, w * 0.6, h * 0.35, 0.04, glass, 'glass')
  }
  if (!window && opening.panel_count) {
    for (let index = 0; index < opening.panel_count; index++) addBox(0, y + h * (index + 0.5) / opening.panel_count, w * 0.7, h / opening.panel_count * 0.65, 0.04, frameMaterial, 'leaf-panel')
  }
  return group
}
