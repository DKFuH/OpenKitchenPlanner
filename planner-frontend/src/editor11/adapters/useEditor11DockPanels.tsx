import type { ReactNode } from 'react'
import type { CameraPresetMode } from '../../api/cameraPresets.js'
import { CameraPresetPanel } from '../../components/editor/CameraPresetPanel.js'
import { DaylightPanel } from '../../components/editor/DaylightPanel.js'
import { MaterialPanel } from '../../components/editor/MaterialPanel.js'
import { NavigationSettingsPanel } from '../../components/editor/NavigationSettingsPanel.js'
import { RenderEnvironmentPanel } from '../../components/editor/RenderEnvironmentPanel.js'
import { SectionPanel } from '../../components/editor/SectionPanel.js'
import { StairsPanel } from '../../components/editor/StairsPanel.js'
import { ImportJobPanel } from '../../components/imports/ImportJobPanel.js'
import { ImportReviewPanel } from '../../components/imports/ImportReviewPanel.js'
import type { RoomPayload } from '../../api/rooms.js'

interface UseEditor11DockPanelsArgs {
  classNames: {
    cameraDock: string
    navigationDock: string
    renderEnvironmentDock: string
    importDock: string
    importNotice: string
    importNoticeError: string
    daylightDock: string
    daylightDockShifted: string
    materialDock: string
    materialDockShifted: string
    materialDockShiftedDouble: string
  }
  cameraPanel: {
    open: boolean
    presets: React.ComponentProps<typeof CameraPresetPanel>['presets']
    activePresetId: string | null
    loading: boolean
    saving: boolean
    cameraFovDeg: number
    onSetCameraFovDeg: (value: number) => void
    onSaveCurrentPreset: (payload: { name: string; mode: CameraPresetMode; isDefault: boolean }) => void
    onApplyPreset: (presetId: string) => void
    onDeletePreset: (presetId: string) => void
    onSetDefaultPreset: (presetId: string) => void
  }
  stairsPanel: {
    open: boolean
    enabled: boolean
    levels: React.ComponentProps<typeof StairsPanel>['levels']
    connections: React.ComponentProps<typeof StairsPanel>['connections']
    activeLevelId: string | null
    selectedRoomId: string | null
    onCreate: React.ComponentProps<typeof StairsPanel>['onCreate']
    onUpdate: React.ComponentProps<typeof StairsPanel>['onUpdate']
    onDelete: React.ComponentProps<typeof StairsPanel>['onDelete']
  }
  sectionsPanel: {
    open: boolean
    enabled: boolean
    hasSelectedRoom: boolean
    activeLevelId: string | null
    levels: React.ComponentProps<typeof SectionPanel>['levels']
    sections: React.ComponentProps<typeof SectionPanel>['sections']
    selectedSectionId: string | null
    onSelect: (id: string | null) => void
    onCreate: React.ComponentProps<typeof SectionPanel>['onCreate']
    onUpdate: React.ComponentProps<typeof SectionPanel>['onUpdate']
    onDelete: React.ComponentProps<typeof SectionPanel>['onDelete']
  }
  navigationPanel: {
    open: boolean
    settings: React.ComponentProps<typeof NavigationSettingsPanel>['settings']
    onChange: React.ComponentProps<typeof NavigationSettingsPanel>['onChange']
  }
  renderEnvironmentPanel: {
    open: boolean
    presets: React.ComponentProps<typeof RenderEnvironmentPanel>['presets']
    environment: React.ComponentProps<typeof RenderEnvironmentPanel>['environment']
    saving: boolean
    onChange: React.ComponentProps<typeof RenderEnvironmentPanel>['onChange']
    onSave: React.ComponentProps<typeof RenderEnvironmentPanel>['onSave']
  }
  importPanel: {
    open: boolean
    projectId: string | null
    onJobUpdated: React.ComponentProps<typeof ImportJobPanel>['onJobUpdated']
    notice: string | null
    noticeError: boolean
    activeImportJobId: string | null
  }
  daylightPanel: {
    enabled: boolean
    open: boolean
    shifted: boolean
    environment: React.ComponentProps<typeof DaylightPanel>['environment'] | null
    preview: React.ComponentProps<typeof DaylightPanel>['preview']
    loadingPreview: boolean
    savingEnvironment: boolean
    onChange: React.ComponentProps<typeof DaylightPanel>['onChange']
    onSave: () => void
    onRefreshPreview: () => void
  }
  materialPanel: {
    enabled: boolean
    open: boolean
    shifted: 'none' | 'single' | 'double'
    projectId: string | null
    room: RoomPayload | null
    onApplied: React.ComponentProps<typeof MaterialPanel>['onApplied']
  }
}

interface Editor11DockPanels {
  dockPanels: ReactNode[]
}

export function useEditor11DockPanels({
  classNames,
  cameraPanel,
  stairsPanel,
  sectionsPanel,
  navigationPanel,
  renderEnvironmentPanel,
  importPanel,
  daylightPanel,
  materialPanel,
}: UseEditor11DockPanelsArgs): Editor11DockPanels {
  const dockPanels: ReactNode[] = []

  if (cameraPanel.open) {
    dockPanels.push(
      <div key="camera" className={classNames.cameraDock}>
        <CameraPresetPanel
          presets={cameraPanel.presets}
          activePresetId={cameraPanel.activePresetId}
          loading={cameraPanel.loading}
          saving={cameraPanel.saving}
          cameraFovDeg={cameraPanel.cameraFovDeg}
          onSetCameraFovDeg={cameraPanel.onSetCameraFovDeg}
          onSaveCurrentPreset={cameraPanel.onSaveCurrentPreset}
          onApplyPreset={cameraPanel.onApplyPreset}
          onDeletePreset={cameraPanel.onDeletePreset}
          onSetDefaultPreset={cameraPanel.onSetDefaultPreset}
        />
      </div>,
    )
  }

  if (stairsPanel.open) {
    dockPanels.push(
      <div key="stairs" className={classNames.navigationDock}>
        <StairsPanel
          enabled={stairsPanel.enabled}
          levels={stairsPanel.levels}
          connections={stairsPanel.connections}
          activeLevelId={stairsPanel.activeLevelId}
          selectedRoomId={stairsPanel.selectedRoomId}
          onCreate={stairsPanel.onCreate}
          onUpdate={stairsPanel.onUpdate}
          onDelete={stairsPanel.onDelete}
        />
      </div>,
    )
  }

  if (sectionsPanel.open) {
    dockPanels.push(
      <div key="sections" className={classNames.navigationDock}>
        <SectionPanel
          enabled={sectionsPanel.enabled}
          hasSelectedRoom={sectionsPanel.hasSelectedRoom}
          activeLevelId={sectionsPanel.activeLevelId}
          levels={sectionsPanel.levels}
          sections={sectionsPanel.sections}
          selectedSectionId={sectionsPanel.selectedSectionId}
          onSelect={sectionsPanel.onSelect}
          onCreate={sectionsPanel.onCreate}
          onUpdate={sectionsPanel.onUpdate}
          onDelete={sectionsPanel.onDelete}
        />
      </div>,
    )
  }

  if (navigationPanel.open) {
    dockPanels.push(
      <div key="navigation" className={classNames.navigationDock}>
        <NavigationSettingsPanel settings={navigationPanel.settings} onChange={navigationPanel.onChange} />
      </div>,
    )
  }

  if (renderEnvironmentPanel.open) {
    dockPanels.push(
      <div key="render-env" className={classNames.renderEnvironmentDock}>
        <RenderEnvironmentPanel
          presets={renderEnvironmentPanel.presets}
          environment={renderEnvironmentPanel.environment}
          saving={renderEnvironmentPanel.saving}
          onChange={renderEnvironmentPanel.onChange}
          onSave={renderEnvironmentPanel.onSave}
        />
      </div>,
    )
  }

  if (importPanel.open && importPanel.projectId) {
    dockPanels.push(
      <div key="import" className={classNames.importDock}>
        <ImportJobPanel projectId={importPanel.projectId} onJobUpdated={importPanel.onJobUpdated} />
        {importPanel.notice && (
          <p className={`${classNames.importNotice} ${importPanel.noticeError ? classNames.importNoticeError : ''}`}>
            {importPanel.notice}
          </p>
        )}
        {importPanel.activeImportJobId && <ImportReviewPanel jobId={importPanel.activeImportJobId} />}
      </div>,
    )
  }

  if (daylightPanel.enabled && daylightPanel.open && daylightPanel.environment) {
    dockPanels.push(
      <div
        key="daylight"
        className={`${classNames.daylightDock} ${daylightPanel.shifted ? classNames.daylightDockShifted : ''}`}
      >
        <DaylightPanel
          environment={daylightPanel.environment}
          preview={daylightPanel.preview}
          loadingPreview={daylightPanel.loadingPreview}
          savingEnvironment={daylightPanel.savingEnvironment}
          onChange={daylightPanel.onChange}
          onSave={daylightPanel.onSave}
          onRefreshPreview={daylightPanel.onRefreshPreview}
        />
      </div>,
    )
  }

  if (materialPanel.enabled && materialPanel.open && materialPanel.projectId) {
    const materialDockClassName = `${classNames.materialDock} ${
      materialPanel.shifted === 'double'
        ? classNames.materialDockShiftedDouble
        : materialPanel.shifted === 'single'
          ? classNames.materialDockShifted
          : ''
    }`

    dockPanels.push(
      <div key="material" className={materialDockClassName}>
        <MaterialPanel
          projectId={materialPanel.projectId}
          room={materialPanel.room}
          onApplied={materialPanel.onApplied}
        />
      </div>,
    )
  }

  return { dockPanels }
}
