import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProjectDetail, ProjectLockState } from '../../api/projects.js'
import type { TenantPluginsResponse } from '../../api/tenantSettings.js'
import type { EditorActionStates } from '../../editor/actionStateResolver.js'
import type { AppShellEditorBridgeState } from '../../components/layout/AppShellEditorBridge.js'
import type { EditorMode } from '../../editor/editorModeStore.js'
import type { WorkflowStep } from '../../editor/workflowStateStore.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

function sameActionState(
  left: EditorActionStates[keyof EditorActionStates],
  right: EditorActionStates[keyof EditorActionStates],
) {
  return (
    left.enabled === right.enabled &&
    left.visible === right.visible &&
    left.reasonIfDisabled === right.reasonIfDisabled
  )
}

function sameActionStates(left: EditorActionStates, right: EditorActionStates) {
  const keys = Object.keys(left) as Array<keyof EditorActionStates>
  return keys.every((key) => sameActionState(left[key], right[key]))
}

function sameStringArray(left: string[], right: string[]) {
  return left.length === right.length && left.every((entry, index) => entry === right[index])
}

function sameAvailablePlugins(
  left: TenantPluginsResponse['available'],
  right: TenantPluginsResponse['available'],
) {
  return (
    left.length === right.length &&
    left.every((entry, index) => (
      entry.id === right[index]?.id &&
      entry.name === right[index]?.name
    ))
  )
}

function sameTenantPlugins(
  left: TenantPluginsResponse | null,
  right: TenantPluginsResponse | null,
) {
  if (left === right) {
    return true
  }
  if (!left || !right) {
    return false
  }

  return (
    sameStringArray(left.enabled, right.enabled) &&
    sameAvailablePlugins(left.available, right.available)
  )
}

function sameBridgeState(
  previous: AppShellEditorBridgeState | null,
  next: AppShellEditorBridgeState,
) {
  if (!previous) {
    return false
  }

  return (
    previous.workflowStep === next.workflowStep &&
    previous.modeLabel === next.modeLabel &&
    previous.canGoNext === next.canGoNext &&
    previous.canGoPrevious === next.canGoPrevious &&
    previous.goToNextStep === next.goToNextStep &&
    previous.goToPreviousStep === next.goToPreviousStep &&
    sameActionStates(previous.actionStates, next.actionStates) &&
    sameTenantPlugins(previous.tenantPlugins, next.tenantPlugins) &&
    previous.projectName === next.projectName &&
    previous.lockStateLabel === next.lockStateLabel &&
    previous.viewMode === next.viewMode &&
    previous.editorMode === next.editorMode &&
    previous.magnetismEnabled === next.magnetismEnabled &&
    previous.axisMagnetismEnabled === next.axisMagnetismEnabled &&
    previous.angleSnapEnabled === next.angleSnapEnabled &&
    previous.safeEditEnabled === next.safeEditEnabled &&
    previous.areasVisible === next.areasVisible &&
    previous.rightSidebarVisible === next.rightSidebarVisible &&
    previous.onSetViewMode === next.onSetViewMode &&
    previous.onTogglePanel === next.onTogglePanel &&
    previous.onEditorCommand === next.onEditorCommand
  )
}

interface AppShellBridge {
  setEditorBridgeState: Dispatch<SetStateAction<AppShellEditorBridgeState | null>>
}

interface WorkflowState {
  step: WorkflowStep
  setStep: Dispatch<SetStateAction<WorkflowStep>>
  canGoNext: boolean
  canGoPrevious: boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
}

interface EditorModeState {
  setMode: (mode: EditorMode) => void
}

interface UseEditor11AppShellBridgeArgs {
  appShellBridge: AppShellBridge | null
  workflow: WorkflowState
  editorMode: EditorModeState
  modeLabel: string
  actionStates: EditorActionStates
  tenantPlugins: TenantPluginsResponse | null
  project: ProjectDetail | null
  projectLockState: ProjectLockState | null
  viewMode: PlannerViewMode
  currentMode: EditorMode
  magnetismEnabled: boolean
  axisMagnetismEnabled: boolean
  angleSnapEnabled: boolean
  safeEditEnabled: boolean
  areasVisible: boolean
  rightSidebarVisible: boolean
  unknownUserLabel: string
  onSetViewMode: (mode: PlannerViewMode) => void
  onTogglePanel: (panel: string) => void
  onScreenshot: () => void
  onExport360: () => void
  onAutocomplete: () => void
  onGltfExport: () => void
  onMarkDelivered: () => void
  onImportDxf: () => void
  onImportIfc: () => void
  onImportSketchup: () => void
  onToggleMagnetism: () => void
  onToggleAxisMagnetism: () => void
  onToggleAngleSnap: () => void
  onToggleSafeEdit: () => void
  onToggleAreas: () => void
  onToggleActiveLevelVisibility: () => void
  onToggleDimensionsVisibility: () => void
  onTogglePlacementsVisibility: () => void
  onToggleActiveLevelLock: () => void
  onToggleDimensionsLock: () => void
  onResetWorkspaceLayout: () => void
}

export function useEditor11AppShellBridge({
  appShellBridge,
  workflow,
  editorMode,
  modeLabel,
  actionStates,
  tenantPlugins,
  project,
  projectLockState,
  viewMode,
  currentMode,
  magnetismEnabled,
  axisMagnetismEnabled,
  angleSnapEnabled,
  safeEditEnabled,
  areasVisible,
  rightSidebarVisible,
  unknownUserLabel,
  onSetViewMode,
  onTogglePanel,
  onScreenshot,
  onExport360,
  onAutocomplete,
  onGltfExport,
  onMarkDelivered,
  onImportDxf,
  onImportIfc,
  onImportSketchup,
  onToggleMagnetism,
  onToggleAxisMagnetism,
  onToggleAngleSnap,
  onToggleSafeEdit,
  onToggleAreas,
  onToggleActiveLevelVisibility,
  onToggleDimensionsVisibility,
  onTogglePlacementsVisibility,
  onToggleActiveLevelLock,
  onToggleDimensionsLock,
  onResetWorkspaceLayout,
}: UseEditor11AppShellBridgeArgs) {
  const lockStateLabel = projectLockState?.locked
    ? `LOCK ${projectLockState.locked_by_user ?? unknownUserLabel}${projectLockState.locked_by_host ? ` @ ${projectLockState.locked_by_host}` : ''}${projectLockState.locked_at ? ` | ${new Date(projectLockState.locked_at).toLocaleString()}` : ''}`
    : null

  const handlersRef = useRef({
    onSetViewMode,
    onTogglePanel,
    onScreenshot,
    onExport360,
    onAutocomplete,
    onGltfExport,
    onMarkDelivered,
    onImportDxf,
    onImportIfc,
    onImportSketchup,
    onToggleMagnetism,
    onToggleAxisMagnetism,
    onToggleAngleSnap,
    onToggleSafeEdit,
    onToggleAreas,
    onToggleActiveLevelVisibility,
    onToggleDimensionsVisibility,
    onTogglePlacementsVisibility,
    onToggleActiveLevelLock,
    onToggleDimensionsLock,
    onResetWorkspaceLayout,
    setMode: editorMode.setMode,
    setWorkflowStep: workflow.setStep,
    goToNextStep: workflow.goToNextStep,
    goToPreviousStep: workflow.goToPreviousStep,
  })

  useEffect(() => {
    handlersRef.current = {
      onSetViewMode,
      onTogglePanel,
      onScreenshot,
      onExport360,
      onAutocomplete,
      onGltfExport,
      onMarkDelivered,
      onImportDxf,
      onImportIfc,
      onImportSketchup,
      onToggleMagnetism,
      onToggleAxisMagnetism,
      onToggleAngleSnap,
      onToggleSafeEdit,
      onToggleAreas,
      onToggleActiveLevelVisibility,
      onToggleDimensionsVisibility,
      onTogglePlacementsVisibility,
      onToggleActiveLevelLock,
      onToggleDimensionsLock,
      onResetWorkspaceLayout,
      setMode: editorMode.setMode,
      setWorkflowStep: workflow.setStep,
      goToNextStep: workflow.goToNextStep,
      goToPreviousStep: workflow.goToPreviousStep,
    }
  }, [
    editorMode.setMode,
    onAutocomplete,
    onExport360,
    onGltfExport,
    onImportDxf,
    onImportIfc,
    onImportSketchup,
    onMarkDelivered,
    onResetWorkspaceLayout,
    onScreenshot,
    onSetViewMode,
    onToggleActiveLevelLock,
    onToggleActiveLevelVisibility,
    onToggleAngleSnap,
    onToggleAreas,
    onToggleAxisMagnetism,
    onToggleDimensionsLock,
    onToggleDimensionsVisibility,
    onToggleMagnetism,
    onTogglePanel,
    onTogglePlacementsVisibility,
    onToggleSafeEdit,
    workflow.goToNextStep,
    workflow.goToPreviousStep,
    workflow.setStep,
  ])

  const handleSetViewMode = useCallback((mode: PlannerViewMode) => {
    handlersRef.current.onSetViewMode(mode)
  }, [])

  const handleTogglePanel = useCallback((panel: string) => {
    handlersRef.current.onTogglePanel(panel)
  }, [])

  const handleGoToNextStep = useCallback(() => {
    handlersRef.current.goToNextStep()
  }, [])

  const handleGoToPreviousStep = useCallback(() => {
    handlersRef.current.goToPreviousStep()
  }, [])

  const handleEditorCommand = useCallback((cmd: string) => {
    const handlers = handlersRef.current

    if (cmd === 'screenshot') handlers.onScreenshot()
    else if (cmd === 'export360') handlers.onExport360()
    else if (cmd === 'autocomplete') handlers.onAutocomplete()
    else if (cmd === 'gltfExport') handlers.onGltfExport()
    else if (cmd === 'markDelivered') handlers.onMarkDelivered()
    else if (cmd === 'importDxf') handlers.onImportDxf()
    else if (cmd === 'importIfc') handlers.onImportIfc()
    else if (cmd === 'importSketchup') handlers.onImportSketchup()
    else if (cmd === 'toggleMagnetism') handlers.onToggleMagnetism()
    else if (cmd === 'toggleAxisMagnetism') handlers.onToggleAxisMagnetism()
    else if (cmd === 'toggleAngleSnap') handlers.onToggleAngleSnap()
    else if (cmd === 'toggleSafeEdit') handlers.onToggleSafeEdit()
    else if (cmd === 'toggleAreas') handlers.onToggleAreas()
    else if (cmd === 'toggleActiveLevelVisibility') handlers.onToggleActiveLevelVisibility()
    else if (cmd === 'toggleDimensionsVisibility') handlers.onToggleDimensionsVisibility()
    else if (cmd === 'togglePlacementsVisibility') handlers.onTogglePlacementsVisibility()
    else if (cmd === 'toggleActiveLevelLock') handlers.onToggleActiveLevelLock()
    else if (cmd === 'toggleDimensionsLock') handlers.onToggleDimensionsLock()
    else if (cmd === 'resetLayout') handlers.onResetWorkspaceLayout()
    else if (cmd.startsWith('setMode:')) handlers.setMode(cmd.slice(8) as EditorMode)
    else if (cmd.startsWith('setWorkflow:')) handlers.setWorkflowStep(cmd.slice(12) as WorkflowStep)
  }, [])

  useEffect(() => {
    return () => {
      appShellBridge?.setEditorBridgeState(null)
    }
  }, [appShellBridge])

  useEffect(() => {
    if (!appShellBridge) {
      return
    }

    const nextBridgeState: AppShellEditorBridgeState = {
      workflowStep: workflow.step,
      modeLabel,
      canGoNext: workflow.canGoNext,
      canGoPrevious: workflow.canGoPrevious,
      goToNextStep: handleGoToNextStep,
      goToPreviousStep: handleGoToPreviousStep,
      actionStates,
      tenantPlugins,
      projectName: project?.name ?? '',
      lockStateLabel,
      viewMode,
      editorMode: currentMode,
      magnetismEnabled,
      axisMagnetismEnabled,
      angleSnapEnabled,
      safeEditEnabled,
      areasVisible,
      rightSidebarVisible,
      onSetViewMode: handleSetViewMode,
      onTogglePanel: handleTogglePanel,
      onEditorCommand: handleEditorCommand,
    }
    appShellBridge.setEditorBridgeState((previous) => (
      sameBridgeState(previous, nextBridgeState) ? previous : nextBridgeState
    ))
  }, [
    actionStates,
    appShellBridge,
    areasVisible,
    angleSnapEnabled,
    axisMagnetismEnabled,
    currentMode,
    handleEditorCommand,
    handleGoToNextStep,
    handleGoToPreviousStep,
    handleSetViewMode,
    handleTogglePanel,
    lockStateLabel,
    magnetismEnabled,
    modeLabel,
    rightSidebarVisible,
    project?.name,
    safeEditEnabled,
    tenantPlugins,
    viewMode,
    workflow.canGoNext,
    workflow.canGoPrevious,
    workflow.step,
  ])
}
