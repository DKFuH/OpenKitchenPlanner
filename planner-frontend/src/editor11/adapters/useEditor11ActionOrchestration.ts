import { useEffect, useMemo } from 'react'
import {
  resolveEditorActionStates,
  resolveViewModeShortcut,
  type EditorActionContext,
  type EditorActionStates,
} from '../../editor/actionStateResolver.js'
import { resolvePluginSlotEntries } from '../../plugins/pluginSlotRegistry.js'
import type { TenantPluginsResponse } from '../../api/tenantSettings.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

interface UseEditor11ActionOrchestrationArgs {
  projectId: string | null
  compactLayout: boolean
  selectedRoomId: string | null
  selectedSectionLineId: string | null
  selectedAlternativeId: string | null
  presentationEnabled: boolean
  daylightEnabled: boolean
  hasProjectEnvironment: boolean
  materialsEnabled: boolean
  autoCompleteLoading: boolean
  previewPopoutOpen: boolean
  gltfExportLoading: boolean
  bulkDeliveredLoading: boolean
  screenshotBusy: boolean
  export360Busy: boolean
  tenantPlugins: TenantPluginsResponse | null
  shortcutFeedback: string | null
  setShortcutFeedback: (value: string | null) => void
  setViewMode: (mode: PlannerViewMode) => void
}

export function useEditor11ActionOrchestration({
  projectId,
  compactLayout,
  selectedRoomId,
  selectedSectionLineId,
  selectedAlternativeId,
  presentationEnabled,
  daylightEnabled,
  hasProjectEnvironment,
  materialsEnabled,
  autoCompleteLoading,
  previewPopoutOpen,
  gltfExportLoading,
  bulkDeliveredLoading,
  screenshotBusy,
  export360Busy,
  tenantPlugins,
  shortcutFeedback,
  setShortcutFeedback,
  setViewMode,
}: UseEditor11ActionOrchestrationArgs) {
  const actionContext = useMemo<EditorActionContext>(() => ({
    hasProjectId: Boolean(projectId),
    compactLayout,
    hasSelectedRoom: Boolean(selectedRoomId),
    hasSelectedSectionLine: Boolean(selectedSectionLineId),
    hasSelectedAlternative: Boolean(selectedAlternativeId),
    presentationEnabled,
    daylightEnabled,
    hasProjectEnvironment,
    materialsEnabled,
    autoCompleteLoading,
    previewPopoutOpen,
    gltfExportLoading,
    bulkDeliveredLoading,
    screenshotBusy,
    export360Busy,
  }), [
    autoCompleteLoading,
    bulkDeliveredLoading,
    compactLayout,
    daylightEnabled,
    export360Busy,
    gltfExportLoading,
    hasProjectEnvironment,
    materialsEnabled,
    previewPopoutOpen,
    presentationEnabled,
    projectId,
    screenshotBusy,
    selectedAlternativeId,
    selectedRoomId,
    selectedSectionLineId,
  ])

  const actionStates = useMemo<EditorActionStates>(() => resolveEditorActionStates(actionContext), [actionContext])

  const sidebarPluginSlots = useMemo(() => {
    if (!tenantPlugins) {
      return []
    }

    return resolvePluginSlotEntries({
      slot: 'sidebar',
      projectId,
      availablePlugins: tenantPlugins.available,
      enabledPluginIds: tenantPlugins.enabled,
    })
  }, [projectId, tenantPlugins])

  useEffect(() => {
    if (!shortcutFeedback) {
      return
    }

    const timer = window.setTimeout(() => {
      setShortcutFeedback(null)
    }, 2200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [setShortcutFeedback, shortcutFeedback])

  useEffect(() => {
    function handleViewModeShortcuts(event: globalThis.KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      const reasonByShortcut: Partial<Record<'2' | '4' | '5', string | undefined>> = {
        '2': actionStates.viewSplit.reasonIfDisabled,
        '4': actionStates.viewElevation.reasonIfDisabled,
        '5': actionStates.viewSection.reasonIfDisabled,
      }

      if ((event.key === '2' || event.key === '4' || event.key === '5') && reasonByShortcut[event.key as '2' | '4' | '5']) {
        setShortcutFeedback(reasonByShortcut[event.key as '2' | '4' | '5'] ?? null)
      }

      const nextMode = resolveViewModeShortcut(event.key, actionStates)
      if (!nextMode) {
        return
      }

      event.preventDefault()
      setShortcutFeedback(null)
      setViewMode(nextMode)
    }

    window.addEventListener('keydown', handleViewModeShortcuts)
    return () => window.removeEventListener('keydown', handleViewModeShortcuts)
  }, [actionStates, setShortcutFeedback, setViewMode])

  return {
    actionStates,
    sidebarPluginSlots,
  }
}
