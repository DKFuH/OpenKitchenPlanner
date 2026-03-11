import {
  resolveNavigationSettings,
  type NavigationSettings,
} from '../components/editor/navigationSettings.js'

export type PlannerViewMode = '2d' | 'split' | 'split3' | '3d' | 'elevation' | 'section'

export const DEFAULT_PLANNER_VIEW_MODE: PlannerViewMode = 'split3'
export const DEFAULT_PLANNER_SPLIT_RATIO = 58
export const DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO = 62
export const DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO = 46

export interface PlannerViewSettings extends NavigationSettings {
  mode: PlannerViewMode
  split_ratio: number
  split3_primary_ratio: number
  split3_secondary_ratio: number
  visitor_visible: boolean
  camera_height_mm: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function settingsKey(projectId: string): string {
  return `okp:planner-view:${projectId}`
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isPlannerViewMode(value: unknown): value is PlannerViewMode {
  return value === '2d' || value === 'split' || value === 'split3' || value === '3d' || value === 'elevation' || value === 'section'
}

function parsePlannerViewSettings(raw: string): PlannerViewSettings {
  const parsed = JSON.parse(raw) as Partial<PlannerViewSettings>
  const mode = isPlannerViewMode(parsed.mode) ? parsed.mode : '2d'
  const navigation = resolveNavigationSettings(parsed)

  return {
    mode,
    split_ratio: typeof parsed.split_ratio === 'number'
      ? clampNumber(parsed.split_ratio, 25, 75)
      : DEFAULT_PLANNER_SPLIT_RATIO,
    split3_primary_ratio: typeof parsed.split3_primary_ratio === 'number'
      ? clampNumber(parsed.split3_primary_ratio, 30, 70)
      : DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO,
    split3_secondary_ratio: typeof parsed.split3_secondary_ratio === 'number'
      ? clampNumber(parsed.split3_secondary_ratio, 25, 75)
      : DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO,
    visitor_visible: parsed.visitor_visible !== false,
    camera_height_mm: typeof parsed.camera_height_mm === 'number'
      ? clampNumber(Math.round(parsed.camera_height_mm), 900, 2400)
      : 1650,
    ...navigation,
  }
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage
  }
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

export function loadPlannerViewSettings(projectId: string, storage?: StorageLike): PlannerViewSettings | null {
  const resolvedStorage = resolveStorage(storage)
  if (!resolvedStorage) {
    return null
  }

  try {
    const raw = resolvedStorage.getItem(settingsKey(projectId))
    if (!raw) {
      return null
    }
    return parsePlannerViewSettings(raw)
  } catch {
    return null
  }
}

export function savePlannerViewSettings(projectId: string, settings: PlannerViewSettings, storage?: StorageLike): void {
  const resolvedStorage = resolveStorage(storage)
  if (!resolvedStorage) {
    return
  }

  try {
    resolvedStorage.setItem(settingsKey(projectId), JSON.stringify(settings))
  } catch {
    // ignore persistence failures in browser privacy mode
  }
}
