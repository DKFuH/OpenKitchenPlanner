import { useEffect, useState } from 'react'
import { annotationsApi } from '../../api/rooms.js'
import { dimensionsApi } from '../../api/dimensions.js'
import type { SectionViewConfig, SectionViewResponse } from '../../api/rooms.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

interface UseEditor11ProjectionStateArgs {
  viewMode: PlannerViewMode
  selectedRoomId: string | null
  selectedElevationWallIndex: number
  selectedSectionLineId: string | null
}

export function useEditor11ProjectionState({
  viewMode,
  selectedRoomId,
  selectedElevationWallIndex,
  selectedSectionLineId,
}: UseEditor11ProjectionStateArgs) {
  const [elevationSvg, setElevationSvg] = useState('')
  const [elevationLoading, setElevationLoading] = useState(false)
  const [sectionView, setSectionView] = useState<SectionViewResponse | null>(null)
  const [sectionViewLoading, setSectionViewLoading] = useState(false)
  const [sectionViewError, setSectionViewError] = useState<string | null>(null)
  const [sectionViewConfigDraft, setSectionViewConfigDraft] = useState<SectionViewConfig | null>(null)

  const showsElevationProjection = viewMode === 'elevation' || viewMode === 'split3'

  useEffect(() => {
    if (!showsElevationProjection || !selectedRoomId) {
      setElevationSvg('')
      setElevationLoading(false)
      return
    }

    let active = true
    setElevationLoading(true)
    dimensionsApi.getElevation(selectedRoomId, selectedElevationWallIndex)
      .then((svg) => {
        if (!active) return
        setElevationSvg(svg)
      })
      .catch(() => {
        if (!active) return
        setElevationSvg('')
      })
      .finally(() => {
        if (!active) return
        setElevationLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedElevationWallIndex, selectedRoomId, showsElevationProjection])

  useEffect(() => {
    if (viewMode !== 'section' || !selectedRoomId || !selectedSectionLineId) {
      setSectionView(null)
      setSectionViewError(null)
      setSectionViewLoading(false)
      setSectionViewConfigDraft(null)
      return
    }

    let active = true
    setSectionViewLoading(true)
    setSectionViewError(null)
    annotationsApi.getSectionView(selectedRoomId, selectedSectionLineId)
      .then((payload) => {
        if (!active) return
        setSectionView(payload)
        setSectionViewConfigDraft(payload.view_config)
      })
      .catch((loadError) => {
        if (!active) return
        setSectionView(null)
        setSectionViewError(loadError instanceof Error ? loadError.message : 'Section-View konnte nicht geladen werden')
      })
      .finally(() => {
        if (!active) return
        setSectionViewLoading(false)
      })

    return () => {
      active = false
    }
  }, [viewMode, selectedRoomId, selectedSectionLineId])

  return {
    elevationSvg,
    elevationLoading,
    sectionView,
    setSectionView,
    sectionViewLoading,
    sectionViewError,
    sectionViewConfigDraft,
    setSectionViewConfigDraft,
  }
}
