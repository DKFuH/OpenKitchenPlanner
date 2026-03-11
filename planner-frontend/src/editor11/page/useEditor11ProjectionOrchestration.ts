import { useEditor11PageState } from '../adapters/useEditor11PageState.js'
import { useEditor11ProjectionState } from '../adapters/useEditor11ProjectionState.js'
import { useEditor11SectionViewSave } from '../adapters/useEditor11SectionViewSave.js'

interface UseEditor11ProjectionOrchestrationArgs {
  pageState: ReturnType<typeof useEditor11PageState>
}

export function useEditor11ProjectionOrchestration({
  pageState,
}: UseEditor11ProjectionOrchestrationArgs) {
  const effectiveViewMode =
    pageState.compactLayout && (pageState.viewMode === 'split' || pageState.viewMode === 'split3') ? '2d' : pageState.viewMode

  const {
    elevationSvg,
    elevationLoading,
    sectionView,
    setSectionView,
    sectionViewLoading,
    sectionViewError,
    sectionViewConfigDraft,
    setSectionViewConfigDraft,
  } = useEditor11ProjectionState({
    viewMode: effectiveViewMode,
    selectedRoomId: pageState.selectedRoomId,
    selectedElevationWallIndex: pageState.selectedElevationWallIndex,
    selectedSectionLineId: pageState.selectedSectionLineId,
  })

  const saveSectionViewConfig = useEditor11SectionViewSave({
    selectedRoomId: pageState.selectedRoomId,
    selectedSectionLineId: pageState.selectedSectionLineId,
    sectionViewConfigDraft,
    setSectionViewSaving: pageState.setSectionViewSaving,
    setSectionLines: pageState.setSectionLines,
    setSectionView,
  })

  return {
    effectiveViewMode,
    projection: {
      elevationLoading,
      elevationSvg,
      sectionViewLoading,
      sectionViewSaving: pageState.sectionViewSaving,
      sectionViewError,
      sectionView,
      sectionViewConfigDraft,
      setSectionViewConfigDraft,
      handleSaveSectionViewConfig: () => {
        void saveSectionViewConfig()
      },
    },
  }
}
