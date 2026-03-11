import { useCallback, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { acousticsApi, type AcousticGridMeta, type GeoJsonGrid } from '../../api/acoustics.js'

type AcousticVariable = 'spl_db' | 'spl_dba' | 't20_s' | 'sti'

interface UseEditor11AcousticsArgs {
  projectId: string | null
  acousticEnabled: boolean
  acousticVariable: AcousticVariable
  activeAcousticGridId: string | null
  acousticGrids: AcousticGridMeta[]
  setAcousticGrids: Dispatch<SetStateAction<AcousticGridMeta[]>>
  setActiveAcousticGridId: Dispatch<SetStateAction<string | null>>
  setAcousticEnabled: Dispatch<SetStateAction<boolean>>
  setAcousticBusy: Dispatch<SetStateAction<boolean>>
  setAcousticVariable: Dispatch<SetStateAction<AcousticVariable>>
  setAcousticGrid: Dispatch<SetStateAction<GeoJsonGrid | null>>
  setAcousticMin: Dispatch<SetStateAction<number | null>>
  setAcousticMax: Dispatch<SetStateAction<number | null>>
}

export function useEditor11Acoustics({
  projectId,
  acousticEnabled,
  acousticVariable,
  activeAcousticGridId,
  acousticGrids,
  setAcousticGrids,
  setActiveAcousticGridId,
  setAcousticEnabled,
  setAcousticBusy,
  setAcousticVariable,
  setAcousticGrid,
  setAcousticMin,
  setAcousticMax,
}: UseEditor11AcousticsArgs) {
  const refreshAcousticGrids = useCallback(async () => {
    if (!projectId) {
      return
    }

    const grids = await acousticsApi.listGrids(projectId)
    setAcousticGrids(grids)

    setActiveAcousticGridId((current) => {
      if (current && grids.some((grid) => grid.id === current)) {
        return current
      }

      const variableMatch = grids.find((grid) => grid.variable === acousticVariable)
      return variableMatch?.id ?? grids[0]?.id ?? null
    })
  }, [acousticVariable, projectId, setAcousticGrids, setActiveAcousticGridId])

  const loadActiveAcousticGrid = useCallback(async () => {
    if (!activeAcousticGridId || !acousticEnabled) {
      setAcousticGrid(null)
      setAcousticMin(null)
      setAcousticMax(null)
      return
    }

    try {
      const grid = await acousticsApi.getTiles(activeAcousticGridId)
      setAcousticGrid(grid)
      setAcousticMin(grid.min)
      setAcousticMax(grid.max)
    } catch (error) {
      console.error('Akustik-Kacheln laden fehlgeschlagen:', error)
      setAcousticGrid(null)
      setAcousticMin(null)
      setAcousticMax(null)
    }
  }, [activeAcousticGridId, acousticEnabled, setAcousticGrid, setAcousticMax, setAcousticMin])

  const handleAcousticUpload = useCallback(async (file: File) => {
    if (!projectId) {
      return
    }

    setAcousticBusy(true)
    try {
      const result = await acousticsApi.importCnivg(projectId, file)
      await refreshAcousticGrids()
      setActiveAcousticGridId(result.grid_id)
      setAcousticEnabled(true)
    } catch (error) {
      alert(`Akustik-Import fehlgeschlagen: ${String(error)}`)
    } finally {
      setAcousticBusy(false)
    }
  }, [projectId, refreshAcousticGrids, setActiveAcousticGridId, setAcousticBusy, setAcousticEnabled])

  const handleDeleteAcousticGrid = useCallback(async (gridId: string) => {
    if (!projectId) {
      return
    }

    setAcousticBusy(true)
    try {
      await acousticsApi.deleteGrid(gridId)
      if (activeAcousticGridId === gridId) {
        setActiveAcousticGridId(null)
      }
      await refreshAcousticGrids()
    } catch (error) {
      alert(`Akustik-Grid loeschen fehlgeschlagen: ${String(error)}`)
    } finally {
      setAcousticBusy(false)
    }
  }, [activeAcousticGridId, projectId, refreshAcousticGrids, setActiveAcousticGridId, setAcousticBusy])

  const handleSetAcousticVariable = useCallback((variable: AcousticVariable) => {
    setAcousticVariable(variable)
    const match = acousticGrids.find((grid) => grid.variable === variable)
    if (match) {
      setActiveAcousticGridId(match.id)
    }
  }, [acousticGrids, setAcousticVariable, setActiveAcousticGridId])

  useEffect(() => {
    if (!projectId) {
      return
    }

    refreshAcousticGrids().catch((error: unknown) => {
      console.error('Akustik-Grids laden fehlgeschlagen:', error)
    })
  }, [projectId, refreshAcousticGrids])

  useEffect(() => {
    const match = acousticGrids.find((grid) => grid.id === activeAcousticGridId)
    if (!match) {
      return
    }

    setAcousticVariable(match.variable)
  }, [activeAcousticGridId, acousticGrids, setAcousticVariable])

  useEffect(() => {
    void loadActiveAcousticGrid()
  }, [loadActiveAcousticGrid])

  return {
    refreshAcousticGrids,
    loadActiveAcousticGrid,
    handleAcousticUpload,
    handleDeleteAcousticGrid,
    handleSetAcousticVariable,
  }
}
