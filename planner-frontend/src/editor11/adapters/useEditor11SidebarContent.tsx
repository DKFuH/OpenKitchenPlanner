import type { ComponentProps, ReactNode } from 'react'
import { LeftSidebar } from '../../components/editor/LeftSidebar.js'
import { LevelsPanel } from '../../components/editor/LevelsPanel.js'

interface UseEditor11SidebarContentArgs {
  showAreasPanel: boolean
  projectId: string | null
  leftSidebarVisible: boolean
  onOpenAlternative: (alternativeId: string | null) => void
  levelsPanelProps: ComponentProps<typeof LevelsPanel>
  leftSidebarProps: Omit<ComponentProps<typeof LeftSidebar>, 'levelsPanel'>
}

export function useEditor11SidebarContent({
  showAreasPanel: _showAreasPanel,
  projectId: _projectId,
  leftSidebarVisible: _leftSidebarVisible,
  onOpenAlternative: _onOpenAlternative,
  levelsPanelProps: _levelsPanelProps,
  leftSidebarProps: _leftSidebarProps,
}: UseEditor11SidebarContentArgs): ReactNode {
  return null
}
