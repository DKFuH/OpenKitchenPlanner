import { useMemo } from 'react'
import type {
  EditorLegacyInspectorCatalogProps,
  EditorLegacyInspectorEntityActions,
  EditorLegacyInspectorGeometryActions,
  EditorLegacyInspectorGroupsProps,
  EditorLegacyInspectorProps,
  EditorLegacyInspectorSelectionProps,
  EditorLegacyInspectorValidationProps,
  EditorLegacyInspectorVisibilityProps,
} from './editorLegacyInspectorTypes.js'

interface UseEditorLegacyInspectorPropsArgs extends
  EditorLegacyInspectorSelectionProps,
  EditorLegacyInspectorGeometryActions,
  EditorLegacyInspectorEntityActions,
  EditorLegacyInspectorValidationProps,
  EditorLegacyInspectorVisibilityProps,
  EditorLegacyInspectorGroupsProps,
  EditorLegacyInspectorCatalogProps {
}

export function useEditorLegacyInspectorProps(
  args: UseEditorLegacyInspectorPropsArgs,
): EditorLegacyInspectorProps {
  const selection = useMemo<EditorLegacyInspectorSelectionProps>(() => ({
    projectId: args.projectId,
    room: args.room,
    levels: args.levels,
    activeLevelId: args.activeLevelId,
    selectedVertexIndex: args.selectedVertexIndex,
    selectedVertex: args.selectedVertex,
    selectedEdgeIndex: args.selectedEdgeIndex,
    dimensions: args.dimensions,
    edgeLengthMm: args.edgeLengthMm,
    dimensionAssistSegments: args.dimensionAssistSegments,
    selectedOpening: args.selectedOpening,
    selectedPlacement: args.selectedPlacement,
    selectedCatalogItem: args.selectedCatalogItem,
    configuredDimensions: args.configuredDimensions,
    onConfigureDimensions: args.onConfigureDimensions,
    chosenOptions: args.chosenOptions,
    onSetChosenOptions: args.onSetChosenOptions,
    ceilingConstraints: args.ceilingConstraints,
    selectedWallGeom: args.selectedWallGeom,
    selectedWallVisible: args.selectedWallVisible,
    selectedWallLocked: args.selectedWallLocked,
  }), [args])

  const geometry = useMemo<EditorLegacyInspectorGeometryActions>(() => ({
    onMoveVertex: args.onMoveVertex,
    onSetEdgeLength: args.onSetEdgeLength,
    onEdgeLengthDraftChange: args.onEdgeLengthDraftChange,
    onSaveCeilingConstraints: args.onSaveCeilingConstraints,
  }), [args])

  const entityActions = useMemo<EditorLegacyInspectorEntityActions>(() => ({
    onUpdateOpening: args.onUpdateOpening,
    onDeleteOpening: args.onDeleteOpening,
    onUpdatePlacement: args.onUpdatePlacement,
    onDeletePlacement: args.onDeletePlacement,
  }), [args])

  const validation = useMemo<EditorLegacyInspectorValidationProps>(() => ({
    validationResult: args.validationResult,
    validationLoading: args.validationLoading,
    onRunValidation: args.onRunValidation,
  }), [args])

  const visibility = useMemo<EditorLegacyInspectorVisibilityProps>(() => ({
    placements: args.placements,
    selectedRoomId: args.selectedRoomId,
    acousticEnabled: args.acousticEnabled,
    acousticOpacityPct: args.acousticOpacityPct,
    acousticVariable: args.acousticVariable,
    acousticGrids: args.acousticGrids,
    activeAcousticGridId: args.activeAcousticGridId,
    acousticMin: args.acousticMin,
    acousticMax: args.acousticMax,
    acousticBusy: args.acousticBusy,
    onToggleAcoustics: args.onToggleAcoustics,
    onSetAcousticOpacityPct: args.onSetAcousticOpacityPct,
    onSetAcousticVariable: args.onSetAcousticVariable,
    onAcousticUpload: args.onAcousticUpload,
    onSelectAcousticGrid: args.onSelectAcousticGrid,
    onDeleteAcousticGrid: args.onDeleteAcousticGrid,
    safeEditMode: args.safeEditMode,
    onToggleSafeEditMode: args.onToggleSafeEditMode,
    onToggleActiveLevelVisibility: args.onToggleActiveLevelVisibility,
    onSetDimensionsVisible: args.onSetDimensionsVisible,
    onSetPlacementsVisible: args.onSetPlacementsVisible,
    onSetSelectedWallVisible: args.onSetSelectedWallVisible,
    autoDollhouse: args.autoDollhouse,
    autoDollhouseSaving: args.autoDollhouseSaving,
    onSaveAutoDollhouse: args.onSaveAutoDollhouse,
    onSetActiveLevelLocked: args.onSetActiveLevelLocked,
    onSetDimensionsLocked: args.onSetDimensionsLocked,
    onSetSelectedPlacementLocked: args.onSetSelectedPlacementLocked,
    onSetSelectedWallLocked: args.onSetSelectedWallLocked,
  }), [args])

  const groups = useMemo<EditorLegacyInspectorGroupsProps>(() => ({
    drawingGroups: args.drawingGroups,
    selectedDrawingGroupId: args.selectedDrawingGroupId,
    currentSelectionMembers: args.currentSelectionMembers,
    onSelectDrawingGroup: args.onSelectDrawingGroup,
    onCreateDrawingGroup: args.onCreateDrawingGroup,
    onDeleteDrawingGroup: args.onDeleteDrawingGroup,
    onApplyDrawingGroupTransform: args.onApplyDrawingGroupTransform,
    onSyncDrawingGroupConfig: args.onSyncDrawingGroupConfig,
  }), [args])

  const catalog = useMemo<EditorLegacyInspectorCatalogProps>(() => ({
    catalogPanel: args.catalogPanel,
  }), [args.catalogPanel])

  return useMemo<EditorLegacyInspectorProps>(() => ({
    ...selection,
    ...geometry,
    ...entityActions,
    ...validation,
    ...visibility,
    ...groups,
    ...catalog,
  }), [catalog, entityActions, geometry, groups, selection, validation, visibility])
}
