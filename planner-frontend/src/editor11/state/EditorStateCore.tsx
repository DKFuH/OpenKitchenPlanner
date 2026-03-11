import { createContext, useContext, type ReactNode } from 'react'
import type { EditorCommand, EditorCommandHandler } from './EditorCommands.js'
import type { EditorStateSnapshot } from './EditorSelection.js'

export interface EditorStateCoreValue {
  snapshot: EditorStateSnapshot
  dispatch: EditorCommandHandler
}

const EditorStateCoreContext = createContext<EditorStateCoreValue | null>(null)

interface EditorStateCoreProviderProps {
  value: EditorStateCoreValue
  children: ReactNode
}

export function EditorStateCoreProvider({ value, children }: EditorStateCoreProviderProps) {
  return (
    <EditorStateCoreContext.Provider value={value}>
      {children}
    </EditorStateCoreContext.Provider>
  )
}

export function useEditorStateCore(): EditorStateCoreValue {
  const context = useContext(EditorStateCoreContext)
  if (!context) {
    throw new Error('useEditorStateCore must be used within EditorStateCoreProvider')
  }
  return context
}

export function useEditorSnapshot(): EditorStateSnapshot {
  return useEditorStateCore().snapshot
}

export function useEditorDispatch(): (command: EditorCommand) => void {
  return useEditorStateCore().dispatch
}
