import { useEffect } from 'react'
import type { InspectorSectionEntry } from '../plugins/EditorPluginContract.js'
import { useEditorPluginHost } from '../plugins/EditorPluginHost.js'

export function useRegisterInspectorSection(
  section: InspectorSectionEntry | null,
  deps: readonly unknown[],
) {
  const host = useEditorPluginHost()

  useEffect(() => {
    if (!section) {
      return () => undefined
    }

    return host.inspector.registerSection(section)
  }, [host, section, ...deps])
}
