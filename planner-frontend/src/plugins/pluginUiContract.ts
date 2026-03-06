import type { TenantPluginInfo } from '../api/tenantSettings.js'

export type PluginSlotId = 'header' | 'sidebar'

export interface PluginSlotContext {
  slot: PluginSlotId
  projectId: string | null
  availablePlugins: TenantPluginInfo[]
  enabledPluginIds: string[]
}

export interface PluginSlotEntry {
  id: string
  slot: PluginSlotId
  label: string
  pluginId?: string
  path: string
  enabled: boolean
  reasonIfDisabled?: string
}
