import type { ReactNode } from 'react'
import { EditorLegacyInspector } from '../inspector/EditorLegacyInspector.js'
import { useEditorLegacyInspectorProps } from '../inspector/useEditorLegacyInspectorProps.js'
import { EditorPluginHostProvider } from '../plugins/EditorPluginHost.js'
import type { EditorPluginDefinition } from '../plugins/EditorPluginContract.js'
import { EditorShell } from '../shell/EditorShell.js'
import { EditorStateCoreProvider } from '../state/EditorStateCore.js'
import { Plan2DViewport } from '../viewports/Plan2DViewport.js'
import { Preview3DViewport } from '../viewports/Preview3DViewport.js'
import { SectionProjectionPanel } from '../viewports/SectionProjectionPanel.js'
import { WallElevationViewport } from '../viewports/WallElevationViewport.js'
import { useEditor11SidebarContent } from '../adapters/useEditor11SidebarContent.js'
import { useEditor11ViewportPanels } from '../adapters/useEditor11ViewportPanels.js'

interface UseEditor11WorkspaceCompositionArgs {
  sidebarArgs: Parameters<typeof useEditor11SidebarContent>[0]
  inspectorArgs: Parameters<typeof useEditorLegacyInspectorProps>[0]
  viewportArgs: Parameters<typeof useEditor11ViewportPanels>[0]
  sectionPanelArgs: {
    classNames: React.ComponentProps<typeof SectionProjectionPanel>['classNames']
    selectedSectionLineId: string | null
    sectionViewLoading: boolean
    sectionViewSaving: boolean
    sectionViewError: string | null
    sectionView: React.ComponentProps<typeof SectionProjectionPanel>['sectionView']
    sectionViewConfigDraft: React.ComponentProps<typeof SectionProjectionPanel>['sectionViewConfigDraft']
    onSaveSectionViewConfig: () => void
    onSetSectionViewConfigDraft: React.ComponentProps<typeof SectionProjectionPanel>['onSetSectionViewConfigDraft']
    onSelectOpening: React.ComponentProps<typeof SectionProjectionPanel>['onSelectOpening']
    onSelectPlacement: React.ComponentProps<typeof SectionProjectionPanel>['onSelectPlacement']
  }
  shellArgs: {
    snapshot: React.ComponentProps<typeof EditorStateCoreProvider>['value']['snapshot']
    dispatch: React.ComponentProps<typeof EditorStateCoreProvider>['value']['dispatch']
    plugins: EditorPluginDefinition[]
    layout: React.ComponentProps<typeof EditorShell>['layout']
    inspectorOpen: boolean
    primaryRatio: number
    secondaryRatio: number
    onPrimaryRatioChange: (value: number) => void
    onSecondaryRatioChange: (value: number) => void
  }
}

interface Editor11WorkspaceComposition {
  sectionProjectionPanel: ReactNode
  tripleEditorViewport: ReactNode
  canvasPanel: ReactNode
  previewPanel: ReactNode
  previewProps: ReturnType<typeof useEditor11ViewportPanels>['previewProps']
}

export function useEditor11WorkspaceComposition({
  sidebarArgs,
  inspectorArgs,
  viewportArgs,
  sectionPanelArgs,
  shellArgs,
}: UseEditor11WorkspaceCompositionArgs): Editor11WorkspaceComposition {
  const leftSidebarContent = useEditor11SidebarContent(sidebarArgs)
  const inspectorProps = useEditorLegacyInspectorProps(inspectorArgs)
  const inspectorContent = <EditorLegacyInspector {...inspectorProps} />
  const {
    canvasPanel,
    previewPanel,
    wallElevationPanel,
    previewProps,
  } = useEditor11ViewportPanels(viewportArgs)

  const sectionProjectionPanel = (
    <SectionProjectionPanel
      classNames={sectionPanelArgs.classNames}
      selectedSectionLineId={sectionPanelArgs.selectedSectionLineId}
      sectionViewLoading={sectionPanelArgs.sectionViewLoading}
      sectionViewSaving={sectionPanelArgs.sectionViewSaving}
      sectionViewError={sectionPanelArgs.sectionViewError}
      sectionView={sectionPanelArgs.sectionView}
      sectionViewConfigDraft={sectionPanelArgs.sectionViewConfigDraft}
      onSaveSectionViewConfig={sectionPanelArgs.onSaveSectionViewConfig}
      onSetSectionViewConfigDraft={sectionPanelArgs.onSetSectionViewConfigDraft}
      onSelectOpening={sectionPanelArgs.onSelectOpening}
      onSelectPlacement={sectionPanelArgs.onSelectPlacement}
    />
  )

  const tripleEditorViewport = (
    <EditorStateCoreProvider value={{ snapshot: shellArgs.snapshot, dispatch: shellArgs.dispatch }}>
      <EditorPluginHostProvider
        snapshot={shellArgs.snapshot}
        dispatch={shellArgs.dispatch}
        plugins={shellArgs.plugins}
      >
        <EditorShell
          leftSidebar={leftSidebarContent}
          plan2d={<Plan2DViewport>{canvasPanel}</Plan2DViewport>}
          preview3d={<Preview3DViewport>{previewPanel}</Preview3DViewport>}
          wallView={<WallElevationViewport>{wallElevationPanel}</WallElevationViewport>}
          layout={shellArgs.layout}
          inspector={inspectorContent}
          inspectorOpen={shellArgs.inspectorOpen}
          primaryRatio={shellArgs.primaryRatio}
          secondaryRatio={shellArgs.secondaryRatio}
          onPrimaryRatioChange={shellArgs.onPrimaryRatioChange}
          onSecondaryRatioChange={shellArgs.onSecondaryRatioChange}
        />
      </EditorPluginHostProvider>
    </EditorStateCoreProvider>
  )

  return {
    sectionProjectionPanel,
    tripleEditorViewport,
    canvasPanel,
    previewPanel,
    previewProps,
  }
}
