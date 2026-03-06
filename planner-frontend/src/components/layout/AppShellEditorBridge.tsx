import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { EditorActionStates } from '../../editor/actionStateResolver.js'
import type { WorkflowStep } from '../../editor/workflowStateStore.js'
import type { TenantPluginsResponse } from '../../api/tenantSettings.js'

export interface AppShellEditorBridgeState {
  workflowStep: WorkflowStep
  modeLabel: string
  canGoNext: boolean
  canGoPrevious: boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
  actionStates: EditorActionStates
  tenantPlugins: TenantPluginsResponse | null
}

interface AppShellEditorBridgeContextValue {
  editorBridgeState: AppShellEditorBridgeState | null
  setEditorBridgeState: Dispatch<SetStateAction<AppShellEditorBridgeState | null>>
}

const AppShellEditorBridgeContext = createContext<AppShellEditorBridgeContextValue | null>(null)

interface AppShellEditorBridgeProviderProps {
  editorBridgeState: AppShellEditorBridgeState | null
  setEditorBridgeState: Dispatch<SetStateAction<AppShellEditorBridgeState | null>>
  children: ReactNode
}

export function AppShellEditorBridgeProvider({
  editorBridgeState,
  setEditorBridgeState,
  children,
}: AppShellEditorBridgeProviderProps) {
  return (
    <AppShellEditorBridgeContext.Provider value={{ editorBridgeState, setEditorBridgeState }}>
      {children}
    </AppShellEditorBridgeContext.Provider>
  )
}

export function useAppShellEditorBridge() {
  const context = useContext(AppShellEditorBridgeContext)
  if (!context) {
    return null
  }
  return context
}
