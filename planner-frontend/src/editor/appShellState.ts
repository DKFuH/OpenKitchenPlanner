import { useEffect, useMemo, useState } from 'react'
import {
  resolveEditorActionStates,
  type EditorActionContext,
  type EditorActionStates,
} from './actionStateResolver.js'
import {
  getEditorModeForWorkflowStep,
  useWorkflowStateStore,
  type WorkflowStep,
} from './workflowStateStore.js'
import {
  useEditorModeStore,
  type DrawCreationMode,
  type EditorMode,
} from './editorModeStore.js'
import type { EditorTool } from './usePolygonEditor.js'

const PROJECT_PATH_PATTERN = /^\/projects\/([^/]+)/

export function projectIdFromPathname(pathname: string): string | null {
  const match = pathname.match(PROJECT_PATH_PATTERN)
  return match?.[1] ?? null
}

export type AppArea = 'kanban' | 'editor' | 'project-detail' | 'settings' | 'app'

export function areaFromPathname(pathname: string): AppArea {
  if (pathname === '/') return 'kanban'
  if (/^\/projects\/[^/]+$/.test(pathname)) return 'editor'
  if (/^\/projects\//.test(pathname)) return 'project-detail'
  if (/^\/settings/.test(pathname)) return 'settings'
  return 'app'
}

function readCompactLayoutState(breakpoint: number): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
}

export interface AppShellActionMatrixInput {
  projectId: string | null
  compactLayout: boolean
  workflowStep: WorkflowStep
}

export interface AppShellActionMatrixResult {
  context: EditorActionContext
  actionStates: EditorActionStates
  suggestedMode: EditorMode
}

export function resolveAppShellActionMatrix(input: AppShellActionMatrixInput): AppShellActionMatrixResult {
  const hasProjectId = input.projectId !== null
  const hasSelectedRoom = input.workflowStep !== 'walls'
  const hasSelectedSectionLine = input.workflowStep === 'furniture'

  const context: EditorActionContext = {
    hasProjectId,
    compactLayout: input.compactLayout,
    hasSelectedRoom,
    hasSelectedSectionLine,
    hasSelectedAlternative: hasProjectId,
    presentationEnabled: true,
    daylightEnabled: true,
    hasProjectEnvironment: hasProjectId,
    materialsEnabled: true,
    autoCompleteLoading: false,
    previewPopoutOpen: false,
    gltfExportLoading: false,
    bulkDeliveredLoading: false,
    screenshotBusy: false,
    export360Busy: false,
  }

  return {
    context,
    actionStates: resolveEditorActionStates(context),
    suggestedMode: getEditorModeForWorkflowStep(input.workflowStep),
  }
}

function useCompactLayout(breakpoint = 960): boolean {
  const [compactLayout, setCompactLayout] = useState(() => readCompactLayoutState(breakpoint))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = () => {
      setCompactLayout(media.matches)
    }

    onChange()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }

    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [breakpoint])

  return compactLayout
}

export interface AppShellState {
  projectId: string | null
  area: AppArea
  compactLayout: boolean
  mode: EditorMode
  modeLabel: string
  activeDrawMode: DrawCreationMode
  setMode: (mode: EditorMode) => void
  workflowStep: WorkflowStep
  setWorkflowStep: (step: WorkflowStep) => void
  canGoNext: boolean
  canGoPrevious: boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
  actionStates: EditorActionStates
}

interface UseAppShellStateOptions {
  pathname: string
  initialWorkflowStep?: WorkflowStep
  initialDrawMode?: DrawCreationMode
}

export function useAppShellState({
  pathname,
  initialWorkflowStep = 'walls',
  initialDrawMode = 'wallCreate',
}: UseAppShellStateOptions): AppShellState {
  const projectId = useMemo(() => projectIdFromPathname(pathname), [pathname])
  const area = useMemo(() => areaFromPathname(pathname), [pathname])
  const compactLayout = useCompactLayout()

  const workflowStore = useWorkflowStateStore({
    initialStep: initialWorkflowStep,
  })

  const [currentTool, setEditorTool] = useState<EditorTool>('select')
  const modeStore = useEditorModeStore({
    currentTool,
    setEditorTool,
    initialDrawMode,
  })

  const { mode, setMode } = modeStore

  const actionMatrix = useMemo(
    () =>
      resolveAppShellActionMatrix({
        projectId,
        compactLayout,
        workflowStep: workflowStore.step,
      }),
    [compactLayout, projectId, workflowStore.step],
  )

  useEffect(() => {
    if (mode !== actionMatrix.suggestedMode) {
      setMode(actionMatrix.suggestedMode)
    }
  }, [actionMatrix.suggestedMode, mode, setMode])

  return useMemo(
    () => ({
      projectId,
      area,
      compactLayout,
      mode: modeStore.mode,
      modeLabel: modeStore.modeLabel,
      activeDrawMode: modeStore.activeDrawMode,
      setMode: modeStore.setMode,
      workflowStep: workflowStore.step,
      setWorkflowStep: workflowStore.setStep,
      canGoNext: workflowStore.canGoNext,
      canGoPrevious: workflowStore.canGoPrevious,
      goToNextStep: workflowStore.goToNextStep,
      goToPreviousStep: workflowStore.goToPreviousStep,
      actionStates: actionMatrix.actionStates,
    }),
    [
      actionMatrix.actionStates,
      compactLayout,
      modeStore.activeDrawMode,
      modeStore.mode,
      modeStore.modeLabel,
      modeStore.setMode,
      projectId,
      workflowStore.canGoNext,
      workflowStore.canGoPrevious,
      workflowStore.goToNextStep,
      workflowStore.goToPreviousStep,
      workflowStore.setStep,
      workflowStore.step,
    ],
  )
}
