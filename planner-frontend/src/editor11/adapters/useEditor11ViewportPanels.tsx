import { useMemo, type ComponentProps, type ReactNode } from 'react'
import { CanvasArea } from '../../components/editor/CanvasArea.js'
import { Preview3D } from '../../components/editor/Preview3D.js'
import { WallElevationPanel } from '../viewports/WallElevationPanel.js'

interface UseEditor11ViewportPanelsArgs {
  canvasProps: ComponentProps<typeof CanvasArea>
  previewProps: ComponentProps<typeof Preview3D>
  wallElevationProps: ComponentProps<typeof WallElevationPanel>
}

interface Editor11ViewportPanels {
  canvasPanel: ReactNode
  previewPanel: ReactNode
  wallElevationPanel: ReactNode
  previewProps: ComponentProps<typeof Preview3D>
}

export function useEditor11ViewportPanels({
  canvasProps,
  previewProps,
  wallElevationProps,
}: UseEditor11ViewportPanelsArgs): Editor11ViewportPanels {
  return useMemo(() => ({
    canvasPanel: <CanvasArea {...canvasProps} />,
    previewPanel: <Preview3D {...previewProps} />,
    wallElevationPanel: <WallElevationPanel {...wallElevationProps} />,
    previewProps,
  }), [canvasProps, previewProps, wallElevationProps])
}
