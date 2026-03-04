import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  languagePacksApi,
  type LanguagePack,
  type LanguagePackCreateBody,
} from '../api/languagePacks.js'
import { useLocale } from '../hooks/useLocale.js'
import styles from './TenantSettingsPage.module.css'

export function LanguagePacksPage() {
  const navigate = useNavigate()
  const { t } = useLocale()

  const [items, setItems] = useState<LanguagePack[]>([])
  const [draftJson, setDraftJson] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [localeCode, setLocaleCode] = useState('de')
  const [name, setName] = useState('')
  const [messagesText, setMessagesText] = useState('{\n  "settings": {\n    "title": "Einstellungen (Custom)"\n  }\n}')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await languagePacksApi.list()
      setItems(result)
      setDraftJson(Object.fromEntries(result.map((pack) => [pack.id, JSON.stringify(pack.messages_json, null, 2)])))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.languagePackLoadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const sortedItems = useMemo(() => (
    [...items].sort((left, right) => `${left.locale_code}:${left.name}`.localeCompare(`${right.locale_code}:${right.name}`))
  ), [items])

  function parseJson(input: string): Record<string, unknown> {
    const parsed = JSON.parse(input) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(t('settings.languagePackInvalidJson'))
    }
    return parsed as Record<string, unknown>
  }

  async function handleCreate() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: LanguagePackCreateBody = {
        locale_code: localeCode.trim().toLowerCase(),
        name: name.trim(),
        scope: 'tenant',
        messages_json: parseJson(messagesText),
        enabled: true,
      }

      if (!payload.name) {
        throw new Error(t('settings.languagePackNameRequired'))
      }

      await languagePacksApi.create(payload)
      setName('')
      setSuccess(t('settings.languagePackCreated'))
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.languagePackSaveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(pack: LanguagePack, enabled: boolean) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const messages_json = parseJson(draftJson[pack.id] ?? '{}')
      await languagePacksApi.patch(pack.id, {
        enabled,
        messages_json,
      })
      setSuccess(t('settings.languagePackSaved'))
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.languagePackSaveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await languagePacksApi.remove(id)
      setSuccess(t('settings.languagePackDeleted'))
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.languagePackSaveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.center}>{t('common.loading')}</div>
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{t('settings.title')}</p>
          <h1>{t('settings.languagePacks')}</h1>
          <p className={styles.subtitle}>{t('settings.languagePacksSubtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate('/settings')}>
            {t('common.back')}
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.languagePackCreate')}</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>{t('settings.languagePackLocale')}</span>
            <input value={localeCode} onChange={(e) => setLocaleCode(e.target.value)} placeholder="de / en / fr / nl" />
          </label>
          <label className={styles.field}>
            <span>{t('settings.languagePackName')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>{t('settings.languagePackJson')}</span>
            <textarea rows={8} value={messagesText} onChange={(e) => setMessagesText(e.target.value)} />
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => void handleCreate()}>
            {saving ? t('common.saving') : t('settings.languagePackCreate')}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.languagePackList')}</h2>
        {sortedItems.length === 0 && <p>{t('settings.languagePackNoItems')}</p>}

        <div className={styles.grid}>
          {sortedItems.map((pack) => (
            <article key={pack.id} className={`${styles.field} ${styles.fieldFull}`}>
              <span>{pack.name} · {pack.locale_code.toUpperCase()} · {pack.scope}</span>
              <label className={styles.field}>
                <input
                  type="checkbox"
                  checked={pack.enabled}
                  onChange={(e) => setItems((prev) => prev.map((item) => item.id === pack.id ? { ...item, enabled: e.target.checked } : item))}
                />
                <span>enabled</span>
              </label>
              <textarea
                rows={8}
                aria-label={t('settings.languagePackJson')}
                value={draftJson[pack.id] ?? '{}'}
                onChange={(e) => setDraftJson((prev) => ({ ...prev, [pack.id]: e.target.value }))}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={saving || pack.scope === 'system'}
                  onClick={() => void handleSave(pack, items.find((entry) => entry.id === pack.id)?.enabled ?? pack.enabled)}
                >
                  {t('settings.languagePackSave')}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={saving || pack.scope === 'system'}
                  onClick={() => void handleDelete(pack.id)}
                >
                  {t('settings.languagePackDelete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
