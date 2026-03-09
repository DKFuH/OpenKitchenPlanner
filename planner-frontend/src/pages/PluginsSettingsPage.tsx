import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Body1Strong,
  Button,
  Card,
  Caption1,
  MessageBar,
  MessageBarBody,
  Spinner,
  Switch,
  Title2,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { getTenantPlugins, updateTenantPlugins } from '../api/tenantSettings.js'

const useStyles = makeStyles({
  page: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: tokens.spacingHorizontalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  subtitle: { color: tokens.colorNeutralForeground3 },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  pluginCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    minHeight: '140px',
  },
  pluginTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  pluginLeft: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
    flex: '1',
  },
  pluginEmoji: { fontSize: '28px', lineHeight: '1.2', flexShrink: 0 },
  pluginInfo: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  pluginDesc: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  badgeRow: { display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap', marginTop: tokens.spacingVerticalXS },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' },
  emptyHint: { color: tokens.colorNeutralForeground3, padding: tokens.spacingVerticalL, textAlign: 'center' },
  unsavedBanner: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: '1px solid ' + tokens.colorPaletteYellowBorder2,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
})

interface PluginMeta {
  emoji: string
  description: string
  category: 'Architektur' | 'Katalog' | 'Analyse' | 'Export' | 'Dokumente' | 'Visualisierung'
}

const PLUGIN_META: Record<string, PluginMeta> = {
  'presentation': {
    emoji: '🖼️',
    description: 'Präsentationsansicht für Kunden mit interaktivem Panorama-Modus.',
    category: 'Visualisierung',
  },
  'viewer-export': {
    emoji: '📤',
    description: 'Export des Projekts als 3D-Viewer-Link oder Datei (GLTF, PDF).',
    category: 'Export',
  },
  'tischler': {
    emoji: '🔨',
    description: 'Schreiner-Schnittliste mit Materialmengen und Stücklisten.',
    category: 'Dokumente',
  },
  'daylight': {
    emoji: '☀️',
    description: 'Tageslicht-Simulation mit Sonnenstands-Analyse und Lux-Werten.',
    category: 'Analyse',
  },
  'materials': {
    emoji: '🎨',
    description: 'Erweiterte Materialverwaltung und Oberflächenzuweisung.',
    category: 'Katalog',
  },
  'stairs': {
    emoji: '🪜',
    description: 'Treppenplaner mit automatischer Stufenberechnung nach DIN 18065.',
    category: 'Architektur',
  },
  'multilevel-docs': {
    emoji: '📐',
    description: 'Flächenberechnung nach DIN 277 über mehrere Geschosse.',
    category: 'Dokumente',
  },
  'asset-library': {
    emoji: '🗃️',
    description: 'Erweiterte Asset-Bibliothek mit eigenen 3D-Modellen und Texturen.',
    category: 'Katalog',
  },
  'feng-shui': {
    emoji: '☯️',
    description: 'Feng Shui Analyse mit Bagua-Zonen, Befunden und Optimierungshinweisen.',
    category: 'Analyse',
  },
}

const CATEGORY_ORDER: PluginMeta['category'][] = [
  'Architektur', 'Analyse', 'Visualisierung', 'Katalog', 'Export', 'Dokumente',
]

const CATEGORY_COLOR: Record<PluginMeta['category'], 'brand' | 'success' | 'warning' | 'informative' | 'severe' | 'danger'> = {
  'Architektur': 'brand',
  'Analyse': 'success',
  'Visualisierung': 'warning',
  'Katalog': 'informative',
  'Export': 'severe',
  'Dokumente': 'danger',
}

export function PluginsSettingsPage() {
  const styles = useStyles()
  const [available, setAvailable] = useState<Array<{ id: string; name: string }>>([])
  const [enabled, setEnabled] = useState<string[]>([])
  const [original, setOriginal] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getTenantPlugins()
      .then((data) => {
        setAvailable(data.available)
        setEnabled(data.enabled)
        setOriginal(data.enabled)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const enabledSet = useMemo(() => new Set(enabled), [enabled])
  const hasChanges = useMemo(
    () => JSON.stringify([...enabled].sort()) !== JSON.stringify([...original].sort()),
    [enabled, original],
  )

  function togglePlugin(pluginId: string, checked: boolean) {
    setEnabled((prev) =>
      checked ? (prev.includes(pluginId) ? prev : [...prev, pluginId]) : prev.filter((id) => id !== pluginId),
    )
    setSuccess(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updated = await updateTenantPlugins(enabled)
      setEnabled(updated.enabled)
      setOriginal(updated.enabled)
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  // Group by category
  const byCategory = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>()
    for (const plugin of available) {
      const cat = PLUGIN_META[plugin.id]?.category ?? 'Sonstige'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(plugin)
    }
    return map
  }, [available])

  const categories = useMemo(() => {
    const knownOrder = CATEGORY_ORDER.filter((c) => byCategory.has(c))
    const rest = [...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c as any))
    return [...knownOrder, ...rest]
  }, [byCategory])

  if (loading) return <Spinner label="Lade Plugins…" style={{ marginTop: 64 }} />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Plugins</Title2>
        <Body1 className={styles.subtitle}>
          Aktiviere optionale Fachmodule für diesen Mandanten. Änderungen gelten für alle Nutzer.
        </Body1>
      </div>

      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      {success && <MessageBar intent="success"><MessageBarBody>Plugin-Einstellungen gespeichert.</MessageBarBody></MessageBar>}

      {hasChanges && (
        <div className={styles.unsavedBanner}>
          <Body1Strong>Ungespeicherte Änderungen</Body1Strong>
          <div className={styles.actions}>
            <Button size="small" onClick={() => { setEnabled(original); setSuccess(false) }}>Zurücksetzen</Button>
            <Button appearance="primary" size="small" disabled={saving} onClick={() => void save()}>
              {saving ? 'Speichern…' : 'Jetzt speichern'}
            </Button>
          </div>
        </div>
      )}

      {available.length === 0 ? (
        <Body1 className={styles.emptyHint}>Keine Plugins verfügbar.</Body1>
      ) : (
        categories.map((category) => (
          <div key={category} className={styles.section}>
            <Title3>{category}</Title3>
            <div className={styles.grid}>
              {(byCategory.get(category) ?? []).map((plugin) => {
                const meta = PLUGIN_META[plugin.id]
                const isEnabled = enabledSet.has(plugin.id)
                return (
                  <Card key={plugin.id}>
                    <div className={styles.pluginCard}>
                      <div className={styles.pluginTop}>
                        <div className={styles.pluginLeft}>
                          <span className={styles.pluginEmoji}>{meta?.emoji ?? '🔌'}</span>
                          <div className={styles.pluginInfo}>
                            <Body1Strong>{plugin.name}</Body1Strong>
                            <Caption1 className={styles.pluginDesc}>
                              {meta?.description ?? 'Kein Beschreibungstext vorhanden.'}
                            </Caption1>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onChange={(_, d) => togglePlugin(plugin.id, d.checked)}
                          aria-label={`${plugin.name} ${isEnabled ? 'deaktivieren' : 'aktivieren'}`}
                        />
                      </div>
                      <div className={styles.badgeRow}>
                        {meta?.category && (
                          <Badge
                            appearance="tint"
                            color={CATEGORY_COLOR[meta.category] ?? 'brand'}
                            size="small"
                          >
                            {meta.category}
                          </Badge>
                        )}
                        <Badge
                          appearance="tint"
                          color={isEnabled ? 'success' : 'subtle'}
                          size="small"
                        >
                          {isEnabled ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}

      {!hasChanges && available.length > 0 && (
        <div className={styles.actions}>
          <Button appearance="primary" disabled={saving || !hasChanges} onClick={() => void save()}>
            Gespeichert
          </Button>
        </div>
      )}
    </div>
  )
}
