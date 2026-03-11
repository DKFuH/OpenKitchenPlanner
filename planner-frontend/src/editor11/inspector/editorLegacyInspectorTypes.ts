import type { ReactNode } from 'react'
import type { Vertex, Point2D } from '@shared/types'
import type { Room } from '../../api/projects.js'
import type { BuildingLevel } from '../../api/levels.js'
import type { Opening } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import type { Dimension } from '../../api/dimensions.js'
import type { DrawingGroup, DrawingGroupConfigPatch, DrawingGroupMember } from '../../api/drawingGroups.js'
import type { AcousticGridMeta } from '../../api/acoustics.js'
import type { UnifiedCatalogItem } from '../../api/catalog.js'
import type { ValidateResponse } from '../../api/validate.js'
import type { AutoDollhousePatch, AutoDollhouseSettings } from '../../api/visibility.js'
import type { DimensionAssistSegment } from '../../editor/roomTopology.js'
import type { CeilingConstraint, ConfiguredDimensions } from '../../components/editor/RightSidebar.js'

export interface EditorLegacyInspectorSelectionProps {
  projectId: string
  room: Room | null
  levels: BuildingLevel[]
  activeLevelId: string | null
  selectedVertexIndex: number | null
  selectedVertex: Vertex | null
  selectedEdgeIndex: number | null
  dimensions: Dimension[]
  edgeLengthMm: number | null
  dimensionAssistSegments: DimensionAssistSegment[]
  selectedOpening: Opening | null
  selectedPlacement: Placement | null
  selectedCatalogItem: UnifiedCatalogItem | null
  configuredDimensions: ConfiguredDimensions | null
  onConfigureDimensions: (dims: ConfiguredDimensions) => void
  chosenOptions: Record<string, string>
  onSetChosenOptions: (options: Record<string, string>) => void
  ceilingConstraints: CeilingConstraint[]
  selectedWallGeom: { id: string; start: Point2D; end: Point2D } | null
  selectedWallVisible: boolean | null
  selectedWallLocked: boolean | null
}

export interface EditorLegacyInspectorGeometryActions {
  onMoveVertex: (index: number, pos: Point2D) => void
  onSetEdgeLength: (edgeIndex: number, lengthMm: number, options?: { fineStep?: boolean }) => void
  onEdgeLengthDraftChange: (lengthMm: number | null) => void
  onSaveCeilingConstraints: (constraints: CeilingConstraint[]) => void
}

export interface EditorLegacyInspectorEntityActions {
  onUpdateOpening: (opening: Opening) => void
  onDeleteOpening: (openingId: string) => void
  onUpdatePlacement: (placement: Placement) => void
  onDeletePlacement: (placementId: string) => void
}

export interface EditorLegacyInspectorValidationProps {
  validationResult: ValidateResponse | null
  validationLoading: boolean
  onRunValidation: () => void
}

export interface EditorLegacyInspectorVisibilityProps {
  placements: Placement[]
  selectedRoomId: string | null
  acousticEnabled: boolean
  acousticOpacityPct: number
  acousticVariable: 'spl_db' | 'spl_dba' | 't20_s' | 'sti'
  acousticGrids: AcousticGridMeta[]
  activeAcousticGridId: string | null
  acousticMin: number | null
  acousticMax: number | null
  acousticBusy: boolean
  onToggleAcoustics: (enabled: boolean) => void
  onSetAcousticOpacityPct: (value: number) => void
  onSetAcousticVariable: (value: 'spl_db' | 'spl_dba' | 't20_s' | 'sti') => void
  onAcousticUpload: (file: File) => void
  onSelectAcousticGrid: (gridId: string | null) => void
  onDeleteAcousticGrid: (gridId: string) => void
  safeEditMode: boolean
  onToggleSafeEditMode: (enabled: boolean) => void
  onToggleActiveLevelVisibility: (next: boolean) => void
  onSetDimensionsVisible: (next: boolean) => void
  onSetPlacementsVisible: (next: boolean) => void
  onSetSelectedWallVisible: (next: boolean) => void
  autoDollhouse: AutoDollhouseSettings | null
  autoDollhouseSaving: boolean
  onSaveAutoDollhouse: (patch: AutoDollhousePatch) => void
  onSetActiveLevelLocked: (next: boolean) => void
  onSetDimensionsLocked: (next: boolean) => void
  onSetSelectedPlacementLocked: (next: boolean) => void
  onSetSelectedWallLocked: (next: boolean) => void
}

export interface EditorLegacyInspectorGroupsProps {
  drawingGroups: DrawingGroup[]
  selectedDrawingGroupId: string | null
  currentSelectionMembers: DrawingGroupMember[]
  onSelectDrawingGroup: (groupId: string | null) => void
  onCreateDrawingGroup: (payload: {
    name: string
    kind: DrawingGroup['kind']
    members_json: DrawingGroupMember[]
  }) => void
  onDeleteDrawingGroup: (groupId: string) => void
  onApplyDrawingGroupTransform: (groupId: string, payload: {
    translate?: { x_mm: number; y_mm: number }
    rotation_deg?: number
  }) => void
  onSyncDrawingGroupConfig: (groupId: string, config: DrawingGroupConfigPatch) => void
}

export interface EditorLegacyInspectorCatalogProps {
  catalogPanel?: ReactNode
}

export type EditorLegacyInspectorProps =
  & EditorLegacyInspectorSelectionProps
  & EditorLegacyInspectorGeometryActions
  & EditorLegacyInspectorEntityActions
  & EditorLegacyInspectorValidationProps
  & EditorLegacyInspectorVisibilityProps
  & EditorLegacyInspectorGroupsProps
  & EditorLegacyInspectorCatalogProps
