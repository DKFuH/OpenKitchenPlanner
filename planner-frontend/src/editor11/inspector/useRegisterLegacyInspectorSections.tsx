import { useRegisterInspectorSection } from './useRegisterInspectorSection.js'
import { LegacySelectionInspectorSection } from './sections/LegacySelectionInspectorSection.js'
import type { EditorLegacyInspectorProps } from './editorLegacyInspectorTypes.js'

export function useRegisterLegacyInspectorSections(props: EditorLegacyInspectorProps) {
  useRegisterInspectorSection(
    props.catalogPanel ? {
      id: 'legacy-catalog',
      title: 'Katalog',
      render: () => props.catalogPanel ?? null,
    } : null,
    [props.catalogPanel],
  )

  useRegisterInspectorSection({
    id: 'legacy-selection',
    title: 'Objekte',
    render: () => (
      <LegacySelectionInspectorSection
        selectedOpening={props.selectedOpening}
        selectedPlacement={props.selectedPlacement}
        selectedVertex={props.selectedVertex}
        selectedVertexIndex={props.selectedVertexIndex}
        selectedEdgeIndex={props.selectedEdgeIndex}
        edgeLengthMm={props.edgeLengthMm}
        dimensionAssistSegments={props.dimensionAssistSegments}
        selectedCatalogItem={props.selectedCatalogItem}
        configuredDimensions={props.configuredDimensions}
        chosenOptions={props.chosenOptions}
        onUpdateOpening={props.onUpdateOpening}
        onDeleteOpening={props.onDeleteOpening}
        onUpdatePlacement={props.onUpdatePlacement}
        onDeletePlacement={props.onDeletePlacement}
        onMoveVertex={props.onMoveVertex}
        onSetEdgeLength={props.onSetEdgeLength}
        onEdgeLengthDraftChange={props.onEdgeLengthDraftChange}
        onConfigureDimensions={props.onConfigureDimensions}
        onSetChosenOptions={props.onSetChosenOptions}
      />
    ),
  }, [
    props.chosenOptions,
    props.configuredDimensions,
    props.dimensionAssistSegments,
    props.edgeLengthMm,
    props.onConfigureDimensions,
    props.onDeleteOpening,
    props.onDeletePlacement,
    props.onEdgeLengthDraftChange,
    props.onMoveVertex,
    props.onSetChosenOptions,
    props.onSetEdgeLength,
    props.onUpdateOpening,
    props.onUpdatePlacement,
    props.selectedCatalogItem,
    props.selectedEdgeIndex,
    props.selectedOpening,
    props.selectedPlacement,
    props.selectedVertex,
    props.selectedVertexIndex,
  ])
}
