import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LeftSidebar } from '../components/editor/LeftSidebar.js'
import { useAppShellEditorBridge } from '../components/layout/AppShellEditorBridge.js'
import { resolveEditorActionStates } from '../editor/actionStateResolver.js'
import { resolvePluginSlotEntries } from '../plugins/pluginSlotRegistry.js'
import type { TenantPluginsResponse } from '../api/tenantSettings.js'
import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  page: {
    display: 'grid',
    gridTemplateColumns: 'minmax(340px, 420px) minmax(220px, 1fr)',
    gap: '1rem',
    minHeight: '78vh',
    '@media (max-width: 960px)': {
      gridTemplateColumns: '1fr',
    },
  },
  infoPanel: {
    display: 'grid',
    alignContent: 'start',
    gap: '0.65rem',
    padding: '1rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    '& h1': {
      margin: '0',
      fontSize: '1rem',
    },
    '& p': {
      margin: '0',
      fontSize: '0.85rem',
      color: tokens.colorNeutralForeground3,
    },
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    '& button': {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      background: tokens.colorNeutralBackground2,
      color: tokens.colorNeutralForeground1,
      padding: '0.35rem 0.55rem',
      borderRadius: tokens.borderRadiusSmall,
      cursor: 'pointer',
    },
  },
  sidebarHost: {
    minHeight: '0',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    background: tokens.colorNeutralBackground1,
  },
})

const HARNESS_TENANT_PLUGINS: TenantPluginsResponse = {
  available: [
    { id: 'presentation', name: 'Praesentation' },
    { id: 'viewer-export', name: 'Viewer-Export' },
    { id: 'asset-library', name: 'Asset Library' },
  ],
  enabled: ['presentation', 'viewer-export', 'asset-library'],
}

export function S109ShellHarnessPage() {
  const styles = useStyles();

const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const appShellBridge = useAppShellEditorBridge()
  const [lastSidebarPath, setLastSidebarPath] = useState<string | null>(null)

  const projectId = id ?? null
  const hasProjectContext = Boolean(projectId)
  const editorFallbackProjectId = id ?? 's109-e2e'

  const actionStates = useMemo(() => resolveEditorActionStates({
    hasProjectId: hasProjectContext,
    compactLayout: false,
    hasSelectedRoom: hasProjectContext,
    hasSelectedSectionLine: hasProjectContext,
    hasSelectedAlternative: hasProjectContext,
    presentationEnabled: true,
    daylightEnabled: true,
    hasProjectEnvironment: hasProjectContext,
    materialsEnabled: true,
    autoCompleteLoading: false,
    previewPopoutOpen: false,
    gltfExportLoading: false,
    bulkDeliveredLoading: false,
    screenshotBusy: false,
    export360Busy: false,
  }), [hasProjectContext])

  const sidebarSlots = useMemo(() => resolvePluginSlotEntries({
    slot: 'sidebar',
    projectId,
    availablePlugins: HARNESS_TENANT_PLUGINS.available,
    enabledPluginIds: HARNESS_TENANT_PLUGINS.enabled,
  }), [projectId])

  useEffect(() => {
    if (!appShellBridge) {
      return
    }

    appShellBridge.setEditorBridgeState({
      workflowStep: 'furniture',
      modeLabel: 'Harness',
      canGoNext: false,
      canGoPrevious: true,
      goToNextStep: () => {
        // no-op in harness mode
      },
      goToPreviousStep: () => {
        // no-op in harness mode
      },
      actionStates,
      tenantPlugins: HARNESS_TENANT_PLUGINS,
      projectName: 'Harness',
      lockStateLabel: null,
      viewMode: '2d',
      editorMode: 'selection',
      magnetismEnabled: true,
      axisMagnetismEnabled: true,
      angleSnapEnabled: true,
      safeEditEnabled: false,
      areasVisible: false,
      rightSidebarVisible: true,
      onSetViewMode: () => { /* harness */ },
      onTogglePanel: () => { /* harness */ },
      onEditorCommand: () => { /* harness */ },
    })

    return () => {
      appShellBridge.setEditorBridgeState(null)
    }
  }, [actionStates, appShellBridge])

  return (
    <main className={styles.page} data-testid='s109-shell-harness'>
      <section className={styles.infoPanel}>
        <h1>S109 Header/Sidebar Smoke Harness</h1>
        <p data-testid='harness-project-id'>Project: {projectId ?? 'global-context'}</p>
        <p data-testid='harness-last-sidebar-path'>
          Sidebar target: {lastSidebarPath ?? '-'}
        </p>
        <div className={styles.actions}>
          <button
            type='button'
            data-testid='harness-reset-path'
            onClick={() => setLastSidebarPath(null)}
          >
            Reset Sidebar Target
          </button>
          <button
            type='button'
            data-testid='harness-open-editor'
            onClick={() => navigate(`/projects/${editorFallbackProjectId}`)}
          >
            Open Real Editor Route
          </button>
        </div>
      </section>

      <div className={styles.sidebarHost} data-testid='harness-sidebar-host'>
        <LeftSidebar
          projectId={projectId}
          rooms={[]}
          selectedRoomId={null}
          onSelectRoom={() => {
            // no-op in harness mode
          }}
          onAddRoom={() => {
            // no-op in harness mode
          }}
          pluginSlotEntries={sidebarSlots}
          onNavigateToPath={(path) => {
            setLastSidebarPath(path)
          }}
        />
      </div>
    </main>
  )
}
