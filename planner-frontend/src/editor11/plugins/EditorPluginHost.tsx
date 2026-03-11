import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { EditorCommandHandler } from '../state/EditorCommands.js'
import type { EditorStateSnapshot } from '../state/EditorSelection.js'
import type {
  EditorOverlayEntry,
  EditorPluginContext,
  EditorPluginDefinition,
  InspectorSectionEntry,
  ToolbarAction,
} from './EditorPluginContract.js'

interface EditorPluginHostContextValue {
  host: EditorPluginContext
  toolbarActions: ToolbarAction[]
  inspectorSections: InspectorSectionEntry[]
  overlays2d: EditorOverlayEntry[]
  overlays3d: EditorOverlayEntry[]
  wallOverlays: EditorOverlayEntry[]
}

const EditorPluginHostContext = createContext<EditorPluginHostContextValue | null>(null)

function upsertById<T extends { id: string }>(entries: T[], nextEntry: T): T[] {
  const index = entries.findIndex((entry) => entry.id === nextEntry.id)
  if (index === -1) {
    return [...entries, nextEntry]
  }

  const nextEntries = entries.slice()
  nextEntries[index] = nextEntry
  return nextEntries
}

function removeById<T extends { id: string }>(entries: T[], entryId: string): T[] {
  return entries.filter((entry) => entry.id !== entryId)
}

interface EditorPluginHostProviderProps {
  snapshot: EditorStateSnapshot
  dispatch: EditorCommandHandler
  plugins?: EditorPluginDefinition[]
  children: ReactNode
}

export function EditorPluginHostProvider({
  snapshot,
  dispatch,
  plugins = [],
  children,
}: EditorPluginHostProviderProps) {
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot

  const [toolbarActions, setToolbarActions] = useState<ToolbarAction[]>([])
  const [inspectorSections, setInspectorSections] = useState<InspectorSectionEntry[]>([])
  const [overlays2d, setOverlays2d] = useState<EditorOverlayEntry[]>([])
  const [overlays3d, setOverlays3d] = useState<EditorOverlayEntry[]>([])
  const [wallOverlays, setWallOverlays] = useState<EditorOverlayEntry[]>([])

  const host = useMemo<EditorPluginContext>(() => ({
    getState: () => snapshotRef.current,
    commands: {
      dispatch,
      register: (_commandId, _handler) => () => undefined,
    },
    toolbar: {
      register: (_slot, action) => {
        setToolbarActions((prev) => upsertById(prev, action))
        return () => {
          setToolbarActions((prev) => removeById(prev, action.id))
        }
      },
    },
    inspector: {
      registerSection: (section) => {
        setInspectorSections((prev) => upsertById(prev, section))
        return () => {
          setInspectorSections((prev) => removeById(prev, section.id))
        }
      },
    },
    overlays2d: {
      register: (entry) => {
        setOverlays2d((prev) => upsertById(prev, entry))
        return () => {
          setOverlays2d((prev) => removeById(prev, entry.id))
        }
      },
    },
    overlays3d: {
      register: (entry) => {
        setOverlays3d((prev) => upsertById(prev, entry))
        return () => {
          setOverlays3d((prev) => removeById(prev, entry.id))
        }
      },
    },
    wallOverlays: {
      register: (entry) => {
        setWallOverlays((prev) => upsertById(prev, entry))
        return () => {
          setWallOverlays((prev) => removeById(prev, entry.id))
        }
      },
    },
  }), [dispatch])

  useEffect(() => {
    const disposers = plugins
      .map((plugin) => plugin.activate(host))
      .filter((dispose): dispose is () => void => typeof dispose === 'function')

    return () => {
      disposers.forEach((dispose) => dispose())
    }
  }, [host, plugins])

  return (
    <EditorPluginHostContext.Provider value={{
      host,
      toolbarActions,
      inspectorSections,
      overlays2d,
      overlays3d,
      wallOverlays,
    }}>
      {children}
    </EditorPluginHostContext.Provider>
  )
}

export function useEditorPluginHost(): EditorPluginContext {
  const context = useContext(EditorPluginHostContext)
  if (!context) {
    throw new Error('useEditorPluginHost must be used within EditorPluginHostProvider')
  }
  return context.host
}

export function useEditorToolbarActions(): ToolbarAction[] {
  const context = useContext(EditorPluginHostContext)
  return context?.toolbarActions ?? []
}

export function useEditorInspectorSections(): InspectorSectionEntry[] {
  const context = useContext(EditorPluginHostContext)
  return context?.inspectorSections ?? []
}

export function useEditor2DOverlays(): EditorOverlayEntry[] {
  const context = useContext(EditorPluginHostContext)
  return context?.overlays2d ?? []
}

export function useEditor3DOverlays(): EditorOverlayEntry[] {
  const context = useContext(EditorPluginHostContext)
  return context?.overlays3d ?? []
}

export function useEditorWallOverlays(): EditorOverlayEntry[] {
  const context = useContext(EditorPluginHostContext)
  return context?.wallOverlays ?? []
}
