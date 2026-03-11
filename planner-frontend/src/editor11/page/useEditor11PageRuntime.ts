import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppShellEditorBridge } from '../../components/layout/AppShellEditorBridge.js'
import { useEditorModeStore } from '../../editor/editorModeStore.js'
import { usePolygonEditor } from '../../editor/usePolygonEditor.js'
import { useWorkflowStateStore } from '../../editor/workflowStateStore.js'
import { useEditorStyles } from '../../pages/Editor.styles.js'
import { useEditor11CameraPresets } from '../adapters/useEditor11CameraPresets.js'
import { useEditor11CameraState } from '../adapters/useEditor11CameraState.js'
import { useEditor11PageLayout } from '../adapters/useEditor11PageLayout.js'
import { useEditor11PageServices } from '../adapters/useEditor11PageServices.js'
import { useEditor11PageState } from '../adapters/useEditor11PageState.js'
import { useEditor11WorkspaceCompositionArgs } from '../composition/useEditor11WorkspaceCompositionArgs.js'
import { useEditor11WorkspaceComposition } from '../composition/useEditor11WorkspaceComposition.js'
import { useEditor11PageRefs } from './useEditor11PageRefs.js'
import { useEditor11PageSelection } from './useEditor11PageSelection.js'
import { useEditor11ProjectionOrchestration } from './useEditor11ProjectionOrchestration.js'

export function useEditor11PageRuntime() {
  const styles = useEditorStyles()
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const appShellBridge = useAppShellEditorBridge()
  const pageState = useEditor11PageState()
  const camera = useEditor11CameraState()
  const cameraPresetsState = useEditor11CameraPresets({
    projectId: id ?? null,
    cameraState: camera.cameraState,
    cameraFovDeg: camera.cameraFovDeg,
    applyCameraPresetLocally: camera.applyCameraPresetLocally,
  })
  const pageRefs = useEditor11PageRefs()
  const editor = usePolygonEditor()
  const editorMode = useEditorModeStore({ currentTool: editor.state.tool, setEditorTool: editor.setTool })
  const workflow = useWorkflowStateStore({ initialStep: 'walls' })
  const baseEditorWithMode = useMemo(() => ({
    ...editor,
    setTool: editorMode.setTool,
  }), [editor, editorMode.setTool])

  const {
    environmentMedia,
    acoustics,
    sidebarPluginSlots,
    visibility,
    documentation,
    roomOperations,
    handleNavigationSettingsChange,
    handleMaterialRoomPatch,
  } = useEditor11PageServices({
    projectId: id ?? null,
    unknownUserLabel: t('editor.lockState.unknownUser'),
    appShellBridge,
    pageState,
    camera,
    editor,
    editorMode,
    workflow,
    refs: pageRefs,
    resetCameraPresetUiState: cameraPresetsState.resetCameraPresetUiState,
  })

  const { effectiveViewMode, projection } = useEditor11ProjectionOrchestration({ pageState })
  const selection = useEditor11PageSelection({
    projectId: id ?? null,
    pageState,
    editor,
    editorMode,
    roomOperations,
    baseEditorWithMode,
  })

  const workspaceCompositionArgs = useEditor11WorkspaceCompositionArgs({
    styles,
    projectId: id ?? null,
    navigate,
    workflowStep: workflow.step,
    sidebarPluginSlots,
    pageState,
    roomOperations,
    selection,
    visibility,
    acoustics,
    projection,
    editor,
    camera,
  })

  const {
    sectionProjectionPanel,
    tripleEditorViewport,
    canvasPanel,
    previewPanel,
    previewProps,
  } = useEditor11WorkspaceComposition(workspaceCompositionArgs)

  const { dockPanels, workspaceView, chromeNodes, statusBarNode, previewPopoutNode } = useEditor11PageLayout({
    styles,
    projectId: id ?? null,
    pageState,
    camera,
    cameraPresetsState,
    roomOperations,
    selection,
    visibility,
    documentation,
    environmentMedia,
    handleNavigationSettingsChange,
    handleMaterialRoomPatch,
    effectiveViewMode,
    captureRootRef: pageRefs.captureRootRef,
    splitContainerRef: pageRefs.splitContainerRef,
    tripleEditorViewport,
    sectionProjectionPanel,
    canvasPanel,
    previewPanel,
    previewProps,
  })

  return {
    styles,
    pageState,
    chromeNodes,
    dockPanels,
    workspaceView,
    statusBarNode,
    previewPopoutNode,
  }
}
