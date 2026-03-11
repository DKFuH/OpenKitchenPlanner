import type { ReactNode } from 'react'
import type { EditorCommandHandler } from '../state/EditorCommands.js'
import type { EditorStateSnapshot } from '../state/EditorSelection.js'

export interface ToolbarAction {
  id: string
  label: string
  run: () => void
}

export interface InspectorSectionEntry {
  id: string
  title: string
  render: () => ReactNode
}

export interface EditorOverlayEntry {
  id: string
  render: () => ReactNode
}

export interface EditorPluginContext {
  getState: () => EditorStateSnapshot
  commands: {
    dispatch: EditorCommandHandler
    register: (commandId: string, handler: EditorCommandHandler) => () => void
  }
  toolbar: {
    register: (slot: string, action: ToolbarAction) => () => void
  }
  inspector: {
    registerSection: (section: InspectorSectionEntry) => () => void
  }
  overlays2d: {
    register: (entry: EditorOverlayEntry) => () => void
  }
  overlays3d: {
    register: (entry: EditorOverlayEntry) => () => void
  }
  wallOverlays: {
    register: (entry: EditorOverlayEntry) => () => void
  }
}

export interface EditorPluginDefinition {
  id: string
  title: string
  activate: (context: EditorPluginContext) => void | (() => void)
}
