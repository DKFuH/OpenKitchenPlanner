import { useCallback } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { projectsApi, type ProjectDetail } from '../../api/projects.js'
import { roomsApi, type ProjectElevationEntry } from '../../api/rooms.js'
import { createCadImportJob, createSkpImportJob, type ImportJob } from '../../api/imports.js'
import { ifcInteropApi } from '../../api/ifcInterop.js'
import { autoCompletionApi } from '../../api/autoCompletion.js'

interface UseEditor11ImportExportActionsArgs {
  projectId: string | null
  selectedAlternativeId: string | null
  selectedRoomId: string | null
  selectedRoomRef: MutableRefObject<{ id: string } | null>
  setProject: Dispatch<SetStateAction<ProjectDetail | null>>
  setProjectElevations: Dispatch<SetStateAction<ProjectElevationEntry[]>>
  setSelectedRoomId: Dispatch<SetStateAction<string | null>>
  setImportDockOpen: Dispatch<SetStateAction<boolean>>
  setActiveImportJobId: Dispatch<SetStateAction<string | null>>
  setImportNotice: Dispatch<SetStateAction<string | null>>
  setImportNoticeError: Dispatch<SetStateAction<boolean>>
  setShortcutFeedback: Dispatch<SetStateAction<string | null>>
  setAutoCompleteLoading: Dispatch<SetStateAction<boolean>>
  setGltfExportLoading: Dispatch<SetStateAction<boolean>>
  setBulkDeliveredLoading: Dispatch<SetStateAction<boolean>>
  setBulkDeliveredMessage: Dispatch<SetStateAction<string | null>>
  setBulkDeliveredError: Dispatch<SetStateAction<boolean>>
}

export function useEditor11ImportExportActions({
  projectId,
  selectedAlternativeId,
  selectedRoomId,
  selectedRoomRef,
  setProject,
  setProjectElevations,
  setSelectedRoomId,
  setImportDockOpen,
  setActiveImportJobId,
  setImportNotice,
  setImportNoticeError,
  setShortcutFeedback,
  setAutoCompleteLoading,
  setGltfExportLoading,
  setBulkDeliveredLoading,
  setBulkDeliveredMessage,
  setBulkDeliveredError,
}: UseEditor11ImportExportActionsArgs) {
  const refreshProjectSnapshot = useCallback(async (preferredRoomId?: string | null) => {
    if (!projectId) {
      return
    }

    const refreshedProject = await projectsApi.get(projectId)
    setProject(refreshedProject)
    setSelectedRoomId((previous) => {
      const preferred = preferredRoomId ?? previous
      if (preferred && refreshedProject.rooms.some((room) => room.id === preferred)) {
        return preferred
      }
      return refreshedProject.rooms[0]?.id ?? null
    })

    try {
      const payload = await roomsApi.listElevations(projectId)
      setProjectElevations(payload.elevations)
    } catch {
      setProjectElevations([])
    }
  }, [projectId, setProject, setProjectElevations, setSelectedRoomId])

  const handleImportJobUpdated = useCallback((job: ImportJob) => {
    setImportDockOpen(true)
    setActiveImportJobId(job.id)

    if (job.status === 'failed') {
      setImportNoticeError(true)
      setImportNotice(job.error_message ?? `Import fehlgeschlagen: ${job.source_filename}`)
      return
    }

    if (job.status === 'done') {
      setImportNoticeError(false)
      setImportNotice(`Import-Review bereit: ${job.source_filename}`)
    }
  }, [setActiveImportJobId, setImportDockOpen, setImportNotice, setImportNoticeError])

  const handleAutoComplete = useCallback(async () => {
    if (!projectId || !selectedRoomRef.current) {
      return
    }
    setAutoCompleteLoading(true)
    try {
      await autoCompletionApi.run(projectId, selectedRoomRef.current.id)
    } catch (error) {
      console.error('Auto-Vervollständigung fehlgeschlagen:', error)
    } finally {
      setAutoCompleteLoading(false)
    }
  }, [projectId, selectedRoomRef, setAutoCompleteLoading])

  const handleGltfExport = useCallback(async () => {
    if (!selectedAlternativeId) {
      alert('Keine Alternative ausgewählt')
      return
    }

    setGltfExportLoading(true)
    try {
      const response = await fetch(`/api/v1/alternatives/${selectedAlternativeId}/export/gltf`, {
        method: 'POST',
        headers: { 'X-Tenant-Id': '00000000-0000-0000-0000-000000000001' },
      })

      if (!response.ok) {
        alert('Export fehlgeschlagen')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `planung-${selectedAlternativeId}.glb`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export fehlgeschlagen')
    } finally {
      setGltfExportLoading(false)
    }
  }, [selectedAlternativeId, setGltfExportLoading])

  const handleMarkAllDelivered = useCallback(async () => {
    if (!selectedAlternativeId) {
      alert('Keine Alternative ausgewählt')
      return
    }

    setBulkDeliveredLoading(true)
    setBulkDeliveredMessage(null)
    setBulkDeliveredError(false)
    try {
      const result = await projectsApi.markAlternativeOrdersDelivered(selectedAlternativeId)
      const plural = result.updated_count === 1 ? '' : 'en'
      setBulkDeliveredMessage(`${result.updated_count} Bestellung${plural} als geliefert markiert`)
    } catch (error) {
      setBulkDeliveredError(true)
      setBulkDeliveredMessage(error instanceof Error ? error.message : 'Bestellstatus konnte nicht aktualisiert werden')
    } finally {
      setBulkDeliveredLoading(false)
    }
  }, [selectedAlternativeId, setBulkDeliveredError, setBulkDeliveredLoading, setBulkDeliveredMessage])

  const handleImportFile = useCallback((format: 'dxf' | 'ifc' | 'sketchup') => {
    if (!projectId) {
      return
    }

    const labels: Record<string, string> = { dxf: 'DXF/DWG', ifc: 'IFC', sketchup: 'SketchUp' }
    const accept: Record<string, string> = { dxf: '.dxf,.dwg', ifc: '.ifc', sketchup: '.skp' }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept[format] ?? ''
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }

      setImportDockOpen(true)
      setImportNoticeError(false)
      setImportNotice(null)
      setShortcutFeedback(`${labels[format]}-Import gestartet: ${file.name}`)

      const doImport = async () => {
        try {
          if (format === 'dxf') {
            const job = await createCadImportJob({ project_id: projectId, file })
            handleImportJobUpdated(job)
          } else if (format === 'sketchup') {
            const job = await createSkpImportJob({ project_id: projectId, file })
            handleImportJobUpdated(job)
          } else if (format === 'ifc') {
            const result = await ifcInteropApi.importIfc(projectId, file)
            await refreshProjectSnapshot(selectedRoomId)
            setActiveImportJobId(null)
            setImportNoticeError(false)
            setImportNotice(`IFC importiert: ${result.rooms_created} Raeume${result.warnings.length > 0 ? `, Hinweise: ${result.warnings.length}` : ''}`)
          }
          setShortcutFeedback(`${labels[format]}-Import erfolgreich`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          setImportNoticeError(true)
          setImportNotice(`${labels[format]}-Import fehlgeschlagen: ${message}`)
          setShortcutFeedback(`${labels[format]}-Import fehlgeschlagen: ${message}`)
        }
      }

      void doImport()
    }
    input.click()
  }, [
    handleImportJobUpdated,
    projectId,
    refreshProjectSnapshot,
    selectedRoomId,
    setActiveImportJobId,
    setImportDockOpen,
    setImportNotice,
    setImportNoticeError,
    setShortcutFeedback,
  ])

  return {
    refreshProjectSnapshot,
    handleImportJobUpdated,
    handleAutoComplete,
    handleGltfExport,
    handleMarkAllDelivered,
    handleImportFile,
  }
}
