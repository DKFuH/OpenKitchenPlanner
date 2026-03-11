import type { ReactNode } from 'react'
import { LayoutSheetTabs } from '../../components/editor/LayoutSheetTabs.js'
import { StatusBar } from '../../components/editor/StatusBar.js'
import type { ProjectDetail } from '../../api/projects.js'
import type { RoomPayload } from '../../api/rooms.js'
import type { BuildingLevel } from '../../api/levels.js'
import type { Room } from '../../api/projects.js'
import { EditorStructurePopover } from '../page/EditorStructurePopover.js'

interface UseEditor11PageChromeArgs {
  classNames: {
    bulkDeliveredError: string
    bulkDeliveredSuccess: string
    shortcutFeedback: string
  }
  bulkNotice: {
    message: string | null
    error: boolean
  }
  screenshotNotice: {
    message: string | null
    error: boolean
  }
  shortcutFeedback: string | null
  structure: {
    levels: BuildingLevel[]
    activeLevelId: string | null
    onSelectLevel: (id: string) => void
    onToggleLevelVisibility: (level: BuildingLevel) => void
    onCreateLevel: (payload: { name: string; elevation_mm: number }) => void
    rooms: Room[]
    selectedRoomId: string | null
    onSelectRoom: (id: string) => void
    onAddRoom: (name: string) => void
  }
  layoutTabs: {
    projectId: string | null
    activeLevelId: string | null
    activeSheetId: string | null
    onSheetChange: (sheetId: string | null) => void
    showDaylightOptions: boolean
  }
  statusBar: {
    visible: boolean
    project: ProjectDetail | null
    selectedRoom: RoomPayload | null
  }
}

interface Editor11PageChrome {
  chromeNodes: ReactNode[]
  statusBarNode: ReactNode
}

export function useEditor11PageChrome({
  classNames,
  bulkNotice,
  screenshotNotice,
  shortcutFeedback,
  structure,
  layoutTabs,
  statusBar,
}: UseEditor11PageChromeArgs): Editor11PageChrome {
  const chromeNodes: ReactNode[] = [
    <EditorStructurePopover
      key="structure-popover"
      levels={structure.levels}
      activeLevelId={structure.activeLevelId}
      onSelectLevel={structure.onSelectLevel}
      onToggleLevelVisibility={structure.onToggleLevelVisibility}
      onCreateLevel={structure.onCreateLevel}
      rooms={structure.rooms}
      selectedRoomId={structure.selectedRoomId}
      onSelectRoom={structure.onSelectRoom}
      onAddRoom={structure.onAddRoom}
    />,
  ]

  if (bulkNotice.message) {
    chromeNodes.push(
      <div
        key="bulk-notice"
        className={bulkNotice.error ? classNames.bulkDeliveredError : classNames.bulkDeliveredSuccess}
      >
        {bulkNotice.message}
      </div>,
    )
  }

  if (screenshotNotice.message) {
    chromeNodes.push(
      <div
        key="screenshot-notice"
        className={screenshotNotice.error ? classNames.bulkDeliveredError : classNames.bulkDeliveredSuccess}
      >
        {screenshotNotice.message}
      </div>,
    )
  }

  if (shortcutFeedback) {
    chromeNodes.push(
      <div key="shortcut-feedback" className={classNames.shortcutFeedback}>
        {shortcutFeedback}
      </div>,
    )
  }

  if (layoutTabs.projectId) {
    chromeNodes.push(
      <LayoutSheetTabs
        key="layout-tabs"
        projectId={layoutTabs.projectId}
        activeLevelId={layoutTabs.activeLevelId}
        activeSheetId={layoutTabs.activeSheetId}
        onSheetChange={layoutTabs.onSheetChange}
        showDaylightOptions={layoutTabs.showDaylightOptions}
      />,
    )
  }

  const statusBarNode = statusBar.visible && statusBar.project
    ? <StatusBar project={statusBar.project} selectedRoom={statusBar.selectedRoom} />
    : null

  return {
    chromeNodes,
    statusBarNode,
  }
}
