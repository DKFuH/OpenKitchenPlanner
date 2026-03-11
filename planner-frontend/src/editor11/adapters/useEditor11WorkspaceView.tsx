import type { ReactNode, RefObject } from 'react'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'

interface UseEditor11WorkspaceViewArgs {
  effectiveViewMode: PlannerViewMode
  classNames: {
    workspace: string
    editorViewport: string
    splitLayout: string
    splitPane: string
    splitPanePrimary: string
    splitPaneSecondary: string
    splitDivider: string
  }
  captureRootRef: RefObject<HTMLDivElement | null>
  splitContainerRef: RefObject<HTMLDivElement | null>
  onStartSplitDrag: () => void
  tripleEditorViewport: ReactNode
  sectionProjectionPanel: ReactNode
  canvasPanel: ReactNode
  previewPanel: ReactNode
}

export function useEditor11WorkspaceView({
  effectiveViewMode,
  classNames,
  captureRootRef,
  splitContainerRef,
  onStartSplitDrag,
  tripleEditorViewport,
  sectionProjectionPanel,
  canvasPanel,
  previewPanel,
}: UseEditor11WorkspaceViewArgs) {
  const workspaceView = (
    <div className={classNames.workspace}>
      <div className={classNames.editorViewport} ref={captureRootRef as RefObject<HTMLDivElement>}>
        {(effectiveViewMode === '2d'
          || effectiveViewMode === '3d'
          || effectiveViewMode === 'elevation'
          || effectiveViewMode === 'split3') && tripleEditorViewport}

        {effectiveViewMode === 'section' && sectionProjectionPanel}

        {effectiveViewMode === 'split' && (
          <div className={classNames.splitLayout} ref={splitContainerRef as RefObject<HTMLDivElement>}>
            <div className={`${classNames.splitPane} ${classNames.splitPanePrimary}`}>
              {canvasPanel}
            </div>
            <div
              className={classNames.splitDivider}
              role="separator"
              aria-orientation="vertical"
              aria-label="Split-Ansicht verschieben"
              onMouseDown={onStartSplitDrag}
            />
            <div className={`${classNames.splitPane} ${classNames.splitPaneSecondary}`}>
              {previewPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return { workspaceView }
}
