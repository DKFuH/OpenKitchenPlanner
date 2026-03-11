import { useState } from 'react'
import type { SectionLine } from '@shared/types'
import type { ProjectDetail, ProjectLockState } from '../../api/projects.js'
import type { Placement } from '../../api/placements.js'
import type { Dimension } from '../../api/dimensions.js'
import type { Centerline } from '../../api/centerlines.js'
import type { DrawingGroup } from '../../api/drawingGroups.js'
import type { Opening } from '../../api/openings.js'
import type { ValidateResponse } from '../../api/validate.js'
import type { AcousticGridMeta, GeoJsonGrid } from '../../api/acoustics.js'
import type { TenantPluginsResponse } from '../../api/tenantSettings.js'
import type { BuildingLevel } from '../../api/levels.js'
import type { AutoDollhouseSettings } from '../../api/visibility.js'
import type { VerticalConnection } from '../../api/verticalConnections.js'
import type { UnifiedCatalogItem } from '../../api/catalog.js'
import type { ConfiguredDimensions } from '../../components/editor/RightSidebar.js'
import {
  defaultsForNavigationProfile,
  type NavigationSettings,
} from '../../components/editor/navigationSettings.js'
import type { PlannerViewMode } from '../../pages/plannerViewSettings.js'
import {
  DEFAULT_RENDER_ENVIRONMENT_SETTINGS,
  RENDER_ENVIRONMENT_PRESETS,
  type RenderEnvironmentPreset,
  type RenderEnvironmentSettings,
} from '../../components/editor/renderEnvironmentState.js'
import {
  DEFAULT_SCREENSHOT_OPTIONS,
  type ScreenshotOptions,
} from '../../components/editor/screenshotCapture.js'
import type { ProjectEnvironment, SunPreview } from '../../plugins/daylight/index.js'
import type { ProjectElevationEntry } from '../../api/rooms.js'
import {
  DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO,
  DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO,
  DEFAULT_PLANNER_SPLIT_RATIO,
  DEFAULT_PLANNER_VIEW_MODE,
} from '../../pages/plannerViewSettings.js'

export function useEditor11PageState() {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [projectLockState, setProjectLockState] = useState<ProjectLockState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkDeliveredLoading, setBulkDeliveredLoading] = useState(false)
  const [bulkDeliveredMessage, setBulkDeliveredMessage] = useState<string | null>(null)
  const [bulkDeliveredError, setBulkDeliveredError] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [levels, setLevels] = useState<BuildingLevel[]>([])
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<PlannerViewMode>(DEFAULT_PLANNER_VIEW_MODE)
  const [splitRatio, setSplitRatio] = useState(DEFAULT_PLANNER_SPLIT_RATIO)
  const [split3PrimaryRatio, setSplit3PrimaryRatio] = useState(DEFAULT_PLANNER_SPLIT3_PRIMARY_RATIO)
  const [split3SecondaryRatio, setSplit3SecondaryRatio] = useState(DEFAULT_PLANNER_SPLIT3_SECONDARY_RATIO)
  const [activeSplitDrag, setActiveSplitDrag] = useState<'split' | null>(null)
  const [navigationSettings, setNavigationSettings] = useState<NavigationSettings>(defaultsForNavigationProfile('cad'))
  const [navigationPanelOpen, setNavigationPanelOpen] = useState(false)
  const [cameraPresetPanelOpen, setCameraPresetPanelOpen] = useState(false)
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false)
  const [toolboxMenuOpen, setToolboxMenuOpen] = useState(false)
  const [compactLayout, setCompactLayout] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1180 : false))
  const [openings, setOpenings] = useState<Opening[]>([])
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [centerlines, setCenterlines] = useState<Centerline[]>([])
  const [drawingGroups, setDrawingGroups] = useState<DrawingGroup[]>([])
  const [selectedDrawingGroupId, setSelectedDrawingGroupId] = useState<string | null>(null)
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<UnifiedCatalogItem | null>(null)
  const [configuredDimensions, setConfiguredDimensions] = useState<ConfiguredDimensions | null>(null)
  const [chosenOptions, setChosenOptions] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null)
  const [validationLoading, setValidationLoading] = useState(false)
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false)
  const [isPreviewPopoutOpen, setIsPreviewPopoutOpen] = useState(false)
  const [showAreasPanel, setShowAreasPanel] = useState(false)
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(false)
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true)
  const [statusBarVisible] = useState(true)
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null)
  const [gltfExportLoading, setGltfExportLoading] = useState(false)
  const [safeEditMode, setSafeEditMode] = useState(false)
  const [autoDollhouseSettings, setAutoDollhouseSettings] = useState<AutoDollhouseSettings | null>(null)
  const [autoDollhouseSaving, setAutoDollhouseSaving] = useState(false)
  const [acousticEnabled, setAcousticEnabled] = useState(false)
  const [acousticOpacityPct, setAcousticOpacityPct] = useState(50)
  const [acousticVariable, setAcousticVariable] = useState<'spl_db' | 'spl_dba' | 't20_s' | 'sti'>('spl_db')
  const [acousticGrids, setAcousticGrids] = useState<AcousticGridMeta[]>([])
  const [activeAcousticGridId, setActiveAcousticGridId] = useState<string | null>(null)
  const [acousticGrid, setAcousticGrid] = useState<GeoJsonGrid | null>(null)
  const [acousticBusy, setAcousticBusy] = useState(false)
  const [acousticMin, setAcousticMin] = useState<number | null>(null)
  const [acousticMax, setAcousticMax] = useState<number | null>(null)
  const [activeLayoutSheetId, setActiveLayoutSheetId] = useState<string | null>(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null)
  const [presentationEnabled, setPresentationEnabled] = useState(false)
  const [tenantPlugins, setTenantPlugins] = useState<TenantPluginsResponse | null>(null)
  const [daylightEnabled, setDaylightEnabled] = useState(false)
  const [daylightPanelOpen, setDaylightPanelOpen] = useState(false)
  const [renderEnvironmentPanelOpen, setRenderEnvironmentPanelOpen] = useState(false)
  const [renderEnvironmentSettings, setRenderEnvironmentSettings] = useState<RenderEnvironmentSettings>(DEFAULT_RENDER_ENVIRONMENT_SETTINGS)
  const [renderEnvironmentPresets, setRenderEnvironmentPresets] = useState<RenderEnvironmentPreset[]>(RENDER_ENVIRONMENT_PRESETS)
  const [renderEnvironmentSaving, setRenderEnvironmentSaving] = useState(false)
  const [screenshotPanelOpen, setScreenshotPanelOpen] = useState(false)
  const [screenshotOptions] = useState<ScreenshotOptions>(DEFAULT_SCREENSHOT_OPTIONS)
  const [screenshotBusy, setScreenshotBusy] = useState(false)
  const [screenshotMessage, setScreenshotMessage] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState(false)
  const [importDockOpen, setImportDockOpen] = useState(false)
  const [activeImportJobId, setActiveImportJobId] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [importNoticeError, setImportNoticeError] = useState(false)
  const [export360Busy, setExport360Busy] = useState(false)
  const [materialsEnabled, setMaterialsEnabled] = useState(false)
  const [materialPanelOpen, setMaterialPanelOpen] = useState(false)
  const [stairsEnabled, setStairsEnabled] = useState(false)
  const [stairsPanelOpen, setStairsPanelOpen] = useState(false)
  const [multilevelDocsEnabled, setMultilevelDocsEnabled] = useState(false)
  const [sectionsPanelOpen, setSectionsPanelOpen] = useState(false)
  const [verticalConnections, setVerticalConnections] = useState<VerticalConnection[]>([])
  const [sectionLines, setSectionLines] = useState<SectionLine[]>([])
  const [selectedSectionLineId, setSelectedSectionLineId] = useState<string | null>(null)
  const [projectElevations, setProjectElevations] = useState<ProjectElevationEntry[]>([])
  const [selectedElevationWallIndex, setSelectedElevationWallIndex] = useState<number>(0)
  const [sectionViewSaving, setSectionViewSaving] = useState(false)
  const [projectEnvironment, setProjectEnvironment] = useState<ProjectEnvironment | null>(null)
  const [sunPreview, setSunPreview] = useState<SunPreview | null>(null)
  const [daylightSaving, setDaylightSaving] = useState(false)
  const [sunPreviewLoading, setSunPreviewLoading] = useState(false)
  const [edgeLengthPreviewMm, setEdgeLengthPreviewMm] = useState<number | null>(null)

  return {
    project, setProject,
    projectLockState, setProjectLockState,
    loading, setLoading,
    error, setError,
    bulkDeliveredLoading, setBulkDeliveredLoading,
    bulkDeliveredMessage, setBulkDeliveredMessage,
    bulkDeliveredError, setBulkDeliveredError,
    selectedRoomId, setSelectedRoomId,
    levels, setLevels,
    activeLevelId, setActiveLevelId,
    viewMode, setViewMode,
    splitRatio, setSplitRatio,
    split3PrimaryRatio, setSplit3PrimaryRatio,
    split3SecondaryRatio, setSplit3SecondaryRatio,
    activeSplitDrag, setActiveSplitDrag,
    navigationSettings, setNavigationSettings,
    navigationPanelOpen, setNavigationPanelOpen,
    cameraPresetPanelOpen, setCameraPresetPanelOpen,
    sectionMenuOpen, setSectionMenuOpen,
    toolboxMenuOpen, setToolboxMenuOpen,
    compactLayout, setCompactLayout,
    openings, setOpenings,
    selectedOpeningId, setSelectedOpeningId,
    placements, setPlacements,
    dimensions, setDimensions,
    centerlines, setCenterlines,
    drawingGroups, setDrawingGroups,
    selectedDrawingGroupId, setSelectedDrawingGroupId,
    selectedPlacementId, setSelectedPlacementId,
    selectedCatalogItem, setSelectedCatalogItem,
    configuredDimensions, setConfiguredDimensions,
    chosenOptions, setChosenOptions,
    validationResult, setValidationResult,
    validationLoading, setValidationLoading,
    autoCompleteLoading, setAutoCompleteLoading,
    isPreviewPopoutOpen, setIsPreviewPopoutOpen,
    showAreasPanel, setShowAreasPanel,
    leftSidebarVisible, setLeftSidebarVisible,
    rightSidebarVisible, setRightSidebarVisible,
    statusBarVisible,
    selectedAlternativeId, setSelectedAlternativeId,
    gltfExportLoading, setGltfExportLoading,
    safeEditMode, setSafeEditMode,
    autoDollhouseSettings, setAutoDollhouseSettings,
    autoDollhouseSaving, setAutoDollhouseSaving,
    acousticEnabled, setAcousticEnabled,
    acousticOpacityPct, setAcousticOpacityPct,
    acousticVariable, setAcousticVariable,
    acousticGrids, setAcousticGrids,
    activeAcousticGridId, setActiveAcousticGridId,
    acousticGrid, setAcousticGrid,
    acousticBusy, setAcousticBusy,
    acousticMin, setAcousticMin,
    acousticMax, setAcousticMax,
    activeLayoutSheetId, setActiveLayoutSheetId,
    moreMenuOpen, setMoreMenuOpen,
    shortcutFeedback, setShortcutFeedback,
    presentationEnabled, setPresentationEnabled,
    tenantPlugins, setTenantPlugins,
    daylightEnabled, setDaylightEnabled,
    daylightPanelOpen, setDaylightPanelOpen,
    renderEnvironmentPanelOpen, setRenderEnvironmentPanelOpen,
    renderEnvironmentSettings, setRenderEnvironmentSettings,
    renderEnvironmentPresets, setRenderEnvironmentPresets,
    renderEnvironmentSaving, setRenderEnvironmentSaving,
    screenshotPanelOpen, setScreenshotPanelOpen,
    screenshotOptions,
    screenshotBusy, setScreenshotBusy,
    screenshotMessage, setScreenshotMessage,
    screenshotError, setScreenshotError,
    importDockOpen, setImportDockOpen,
    activeImportJobId, setActiveImportJobId,
    importNotice, setImportNotice,
    importNoticeError, setImportNoticeError,
    export360Busy, setExport360Busy,
    materialsEnabled, setMaterialsEnabled,
    materialPanelOpen, setMaterialPanelOpen,
    stairsEnabled, setStairsEnabled,
    stairsPanelOpen, setStairsPanelOpen,
    multilevelDocsEnabled, setMultilevelDocsEnabled,
    sectionsPanelOpen, setSectionsPanelOpen,
    verticalConnections, setVerticalConnections,
    sectionLines, setSectionLines,
    selectedSectionLineId, setSelectedSectionLineId,
    projectElevations, setProjectElevations,
    selectedElevationWallIndex, setSelectedElevationWallIndex,
    sectionViewSaving, setSectionViewSaving,
    projectEnvironment, setProjectEnvironment,
    sunPreview, setSunPreview,
    daylightSaving, setDaylightSaving,
    sunPreviewLoading, setSunPreviewLoading,
    edgeLengthPreviewMm, setEdgeLengthPreviewMm,
  }
}
