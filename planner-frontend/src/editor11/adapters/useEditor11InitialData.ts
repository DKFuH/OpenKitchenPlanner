import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SectionLine } from '@shared/types'
import { projectsApi, type ProjectDetail, type ProjectLockState } from '../../api/projects.js'
import { levelsApi, type BuildingLevel } from '../../api/levels.js'
import { getTenantPlugins, type TenantPluginsResponse } from '../../api/tenantSettings.js'
import { verticalConnectionsApi, type VerticalConnection } from '../../api/verticalConnections.js'
import { visibilityApi, type AutoDollhouseSettings } from '../../api/visibility.js'
import { renderEnvironmentApi } from '../../api/renderEnvironment.js'
import { annotationsApi } from '../../api/rooms.js'
import {
  DEFAULT_RENDER_ENVIRONMENT_SETTINGS,
  RENDER_ENVIRONMENT_PRESETS,
  normalizeRenderEnvironmentSettings,
  type RenderEnvironmentPreset,
  type RenderEnvironmentSettings,
} from '../../components/editor/renderEnvironmentState.js'

interface UseEditor11InitialDataArgs {
  projectId: string | null
  selectedRoomId: string | null
  stairsEnabled: boolean
  multilevelDocsEnabled: boolean
  setProject: Dispatch<SetStateAction<ProjectDetail | null>>
  setProjectLockState: Dispatch<SetStateAction<ProjectLockState | null>>
  setSelectedRoomId: Dispatch<SetStateAction<string | null>>
  setError: Dispatch<SetStateAction<string | null>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setLevels: Dispatch<SetStateAction<BuildingLevel[]>>
  setActiveLevelId: Dispatch<SetStateAction<string | null>>
  setTenantPlugins: Dispatch<SetStateAction<TenantPluginsResponse | null>>
  setPresentationEnabled: Dispatch<SetStateAction<boolean>>
  setDaylightEnabled: Dispatch<SetStateAction<boolean>>
  setMaterialsEnabled: Dispatch<SetStateAction<boolean>>
  setStairsEnabled: Dispatch<SetStateAction<boolean>>
  setMultilevelDocsEnabled: Dispatch<SetStateAction<boolean>>
  setAcousticEnabled: Dispatch<SetStateAction<boolean>>
  setVerticalConnections: Dispatch<SetStateAction<VerticalConnection[]>>
  setAutoDollhouseSettings: Dispatch<SetStateAction<AutoDollhouseSettings | null>>
  setRenderEnvironmentPanelOpen: Dispatch<SetStateAction<boolean>>
  setRenderEnvironmentSettings: Dispatch<SetStateAction<RenderEnvironmentSettings>>
  setRenderEnvironmentPresets: Dispatch<SetStateAction<RenderEnvironmentPreset[]>>
  setSectionLines: Dispatch<SetStateAction<SectionLine[]>>
  setSelectedSectionLineId: Dispatch<SetStateAction<string | null>>
}

export function useEditor11InitialData({
  projectId,
  selectedRoomId,
  stairsEnabled,
  multilevelDocsEnabled,
  setProject,
  setProjectLockState,
  setSelectedRoomId,
  setError,
  setLoading,
  setLevels,
  setActiveLevelId,
  setTenantPlugins,
  setPresentationEnabled,
  setDaylightEnabled,
  setMaterialsEnabled,
  setStairsEnabled,
  setMultilevelDocsEnabled,
  setAcousticEnabled,
  setVerticalConnections,
  setAutoDollhouseSettings,
  setRenderEnvironmentPanelOpen,
  setRenderEnvironmentSettings,
  setRenderEnvironmentPresets,
  setSectionLines,
  setSelectedSectionLineId,
}: UseEditor11InitialDataArgs) {
  useEffect(() => {
    if (!projectId) {
      return
    }

    Promise.all([
      projectsApi.get(projectId),
      projectsApi.lockState(projectId).catch(() => ({
        project_id: projectId,
        locked: false,
        alternative_id: null,
        locked_by_user: null,
        locked_by_host: null,
        locked_at: null,
      })),
    ])
      .then(([project, lockState]) => {
        setProject(project)
        setProjectLockState(lockState)
        setSelectedRoomId(project.rooms[0]?.id ?? null)
      })
      .catch((error: Error) => setError(error.message))
      .finally(() => setLoading(false))
  }, [projectId, setError, setLoading, setProject, setProjectLockState, setSelectedRoomId])

  useEffect(() => {
    if (!projectId) {
      return
    }

    let active = true
    levelsApi.list(projectId)
      .then((projectLevels) => {
        if (!active) {
          return
        }
        const orderedLevels = [...projectLevels].sort((left, right) => left.order_index - right.order_index)
        setLevels(orderedLevels)
        setActiveLevelId((previous) => {
          if (previous && orderedLevels.some((level) => level.id === previous)) {
            return previous
          }
          return orderedLevels[0]?.id ?? null
        })
      })
      .catch(() => {
        if (!active) {
          return
        }
        setLevels([])
        setActiveLevelId(null)
      })

    return () => {
      active = false
    }
  }, [projectId, setActiveLevelId, setLevels])

  useEffect(() => {
    let active = true

    getTenantPlugins()
      .then((result) => {
        if (!active) {
          return
        }
        setTenantPlugins(result)
        setPresentationEnabled(result.enabled.includes('presentation'))
        setDaylightEnabled(result.enabled.includes('daylight'))
        setMaterialsEnabled(result.enabled.includes('materials'))
        setStairsEnabled(result.enabled.includes('stairs'))
        setMultilevelDocsEnabled(result.enabled.includes('multilevel-docs'))
        setAcousticEnabled(result.enabled.includes('raumakustik'))
      })
      .catch(() => {
        if (!active) {
          return
        }
        setTenantPlugins(null)
        setPresentationEnabled(false)
        setDaylightEnabled(false)
        setMaterialsEnabled(false)
        setStairsEnabled(false)
        setMultilevelDocsEnabled(false)
        setAcousticEnabled(false)
      })

    return () => {
      active = false
    }
  }, [
    setAcousticEnabled,
    setDaylightEnabled,
    setMaterialsEnabled,
    setMultilevelDocsEnabled,
    setPresentationEnabled,
    setStairsEnabled,
    setTenantPlugins,
  ])

  useEffect(() => {
    if (!projectId || !stairsEnabled) {
      setVerticalConnections([])
      return
    }

    let active = true
    verticalConnectionsApi.list(projectId)
      .then((items) => {
        if (!active) {
          return
        }
        setVerticalConnections(items)
      })
      .catch(() => {
        if (!active) {
          return
        }
        setVerticalConnections([])
      })

    return () => {
      active = false
    }
  }, [projectId, setVerticalConnections, stairsEnabled])

  useEffect(() => {
    if (!projectId) {
      setAutoDollhouseSettings(null)
      return
    }

    let active = true
    visibilityApi.getAutoDollhouse(projectId)
      .then((settings) => {
        if (!active) {
          return
        }
        setAutoDollhouseSettings(settings)
      })
      .catch(() => {
        if (!active) {
          return
        }
        setAutoDollhouseSettings({
          project_id: projectId,
          enabled: false,
          alpha_front_walls: 0.32,
          distance_threshold: 2400,
          angle_threshold_deg: 35,
        })
      })

    return () => {
      active = false
    }
  }, [projectId, setAutoDollhouseSettings])

  useEffect(() => {
    if (!projectId) {
      setRenderEnvironmentPanelOpen(false)
      setRenderEnvironmentSettings(DEFAULT_RENDER_ENVIRONMENT_SETTINGS)
      setRenderEnvironmentPresets(RENDER_ENVIRONMENT_PRESETS)
      return
    }

    let active = true
    renderEnvironmentApi.get(projectId)
      .then((result) => {
        if (!active) {
          return
        }
        setRenderEnvironmentPresets(result.presets.length > 0 ? result.presets : RENDER_ENVIRONMENT_PRESETS)
        setRenderEnvironmentSettings(normalizeRenderEnvironmentSettings(result.active))
      })
      .catch(() => {
        if (!active) {
          return
        }
        setRenderEnvironmentPresets(RENDER_ENVIRONMENT_PRESETS)
        setRenderEnvironmentSettings(DEFAULT_RENDER_ENVIRONMENT_SETTINGS)
      })

    return () => {
      active = false
    }
  }, [projectId, setRenderEnvironmentPanelOpen, setRenderEnvironmentPresets, setRenderEnvironmentSettings])

  useEffect(() => {
    if (!selectedRoomId || !multilevelDocsEnabled) {
      setSectionLines([])
      setSelectedSectionLineId(null)
      return
    }

    let active = true
    annotationsApi.listSections(selectedRoomId)
      .then((items) => {
        if (!active) {
          return
        }
        setSectionLines(items)
        setSelectedSectionLineId((previous) => (
          previous && items.some((entry) => entry.id === previous)
            ? previous
            : null
        ))
      })
      .catch(() => {
        if (!active) {
          return
        }
        setSectionLines([])
        setSelectedSectionLineId(null)
      })

    return () => {
      active = false
    }
  }, [multilevelDocsEnabled, selectedRoomId, setSectionLines, setSelectedSectionLineId])
}
