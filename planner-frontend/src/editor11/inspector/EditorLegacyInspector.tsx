import { InspectorPanel } from './InspectorPanel.js'
import { useRegisterLegacyInspectorSections } from './useRegisterLegacyInspectorSections.js'
import type { EditorLegacyInspectorProps } from './editorLegacyInspectorTypes.js'

export type {
  EditorLegacyInspectorCatalogProps,
  EditorLegacyInspectorEntityActions,
  EditorLegacyInspectorGeometryActions,
  EditorLegacyInspectorGroupsProps,
  EditorLegacyInspectorProps,
  EditorLegacyInspectorSelectionProps,
  EditorLegacyInspectorValidationProps,
  EditorLegacyInspectorVisibilityProps,
} from './editorLegacyInspectorTypes.js'

export function EditorLegacyInspector(props: EditorLegacyInspectorProps) {
  useRegisterLegacyInspectorSections(props)
  return <InspectorPanel />
}
