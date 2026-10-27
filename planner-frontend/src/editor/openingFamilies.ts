import type { Opening } from '../api/openings.js'

export interface OpeningFamily {
  id: string
  label: string
  sourcePath: string
  modelUrl: string
  planUrl: string
  opening: Pick<Opening, 'type' | 'width_mm' | 'height_mm' | 'sill_height_mm' | 'hinge_side' | 'opening_direction' | 'leaf_count' | 'frame_type' | 'variant' | 'glazing' | 'panel_count' | 'muntin_rows'>
}

interface OpeningTemplateFile {
  schema_version: number
  id: string
  name: string
  category: 'door' | 'window'
  units: 'mm'
  dimensions: { width_mm: number; height_mm: number; depth_mm: number }
  parameters: Omit<OpeningFamily['opening'], 'width_mm' | 'height_mm'>
  files: { model: string; plan: string }
}

const templates = import.meta.glob<OpeningTemplateFile>('../../object-library/*/template.json', { eager: true, import: 'default' })

export const OPENING_FAMILIES: OpeningFamily[] = Object.entries(templates)
  .filter(([, template]) => template.category === 'door' || template.category === 'window')
  .map(([sourcePath, template]) => ({
    id: template.id,
    label: template.name,
    sourcePath,
    modelUrl: `/object-library/${template.id}/${template.files.model}`,
    planUrl: `/object-library/${template.id}/${template.files.plan}`,
    opening: {
      ...template.parameters,
      type: template.category,
      width_mm: template.dimensions.width_mm,
      height_mm: template.dimensions.height_mm,
    },
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'de'))

export function applyOpeningFamily(opening: Opening, familyId: string): Opening {
  if (!familyId) return { ...opening, family_id: undefined }
  const family = OPENING_FAMILIES.find((candidate) => candidate.id === familyId)
  if (!family) return opening
  return { ...opening, glazing: 'none', panel_count: 0, muntin_rows: 0, ...family.opening, family_id: family.id }
}

export function defaultDoorOpening(wallId: string, wallLengthMm: number, id: string): Opening {
  const base: Opening = {
    id,
    wall_id: wallId,
    type: 'door',
    offset_mm: 0,
    width_mm: 885,
    height_mm: 1985,
    sill_height_mm: 0,
    source: 'manual',
  }
  const opening = applyOpeningFamily(base, 'door-single-standard')
  return {
    ...opening,
    width_mm: Math.min(opening.width_mm, wallLengthMm),
    offset_mm: Math.max(0, Math.round((wallLengthMm - Math.min(opening.width_mm, wallLengthMm)) / 2)),
  }
}
