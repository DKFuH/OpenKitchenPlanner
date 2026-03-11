import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SectionLine } from '@shared/types'
import { annotationsApi } from '../../api/rooms.js'
import type { SectionViewConfig, SectionViewResponse } from '../../api/rooms.js'

interface UseEditor11SectionViewSaveArgs {
  selectedRoomId: string | null
  selectedSectionLineId: string | null
  sectionViewConfigDraft: SectionViewConfig | null
  setSectionViewSaving: Dispatch<SetStateAction<boolean>>
  setSectionLines: Dispatch<SetStateAction<SectionLine[]>>
  setSectionView: Dispatch<SetStateAction<SectionViewResponse | null>>
}

export function useEditor11SectionViewSave({
  selectedRoomId,
  selectedSectionLineId,
  sectionViewConfigDraft,
  setSectionViewSaving,
  setSectionLines,
  setSectionView,
}: UseEditor11SectionViewSaveArgs) {
  return useCallback(async () => {
    if (!selectedRoomId || !selectedSectionLineId || !sectionViewConfigDraft) {
      return
    }

    setSectionViewSaving(true)
    try {
      const updated = await annotationsApi.updateSection(selectedRoomId, selectedSectionLineId, {
        view_config: sectionViewConfigDraft,
      } as Partial<Omit<SectionLine, 'id' | 'room_id'>>)

      setSectionLines((previous) => previous.map((entry) => (entry.id === updated.id ? updated : entry)))
      setSectionView((previous) => (previous
        ? {
            ...previous,
            section: updated,
            view_config: sectionViewConfigDraft,
          }
        : previous))
    } finally {
      setSectionViewSaving(false)
    }
  }, [
    sectionViewConfigDraft,
    selectedRoomId,
    selectedSectionLineId,
    setSectionLines,
    setSectionView,
    setSectionViewSaving,
  ])
}
