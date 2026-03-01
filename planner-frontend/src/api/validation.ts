import type {
  CeilingConstraint,
  Opening,
  Point2D,
  RuleViolation,
  WallSegment,
} from '@shared/types'
import { api } from './client.js'

export interface ValidationObject {
  id: string
  type: string
  wall_id: string
  offset_mm: number
  width_mm: number
  depth_mm: number
  height_mm: number
  worldPos?: Point2D
}

export interface ValidateProjectPayload {
  user_id: string
  roomPolygon: Point2D[]
  objects: ValidationObject[]
  openings: Opening[]
  walls: WallSegment[]
  ceilingConstraints: CeilingConstraint[]
  nominalCeilingMm?: number
  minClearanceMm?: number
}

export interface ValidateProjectResponse {
  valid: boolean
  errors: RuleViolation[]
  warnings: RuleViolation[]
  hints: RuleViolation[]
  violations: RuleViolation[]
}

function normalizeViolations(response: ValidateProjectResponse): ValidateProjectResponse {
  const fallback = response.violations ?? []

  return {
    ...response,
    errors: response.errors?.length ? response.errors : fallback.filter((entry) => entry.severity === 'error'),
    warnings: response.warnings?.length ? response.warnings : fallback.filter((entry) => entry.severity === 'warning'),
    hints: response.hints?.length ? response.hints : fallback.filter((entry) => entry.severity === 'hint'),
    violations: fallback,
  }
}

export async function validateProject(
  projectId: string,
  payload: ValidateProjectPayload,
): Promise<ValidateProjectResponse> {
  const response = await api.post<ValidateProjectResponse>(`/projects/${projectId}/validate`, payload)
  return normalizeViolations(response)
}
