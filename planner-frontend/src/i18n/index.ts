import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './de.js'
import { en } from './en.js'
import { resolveLocale } from './resolveLocale.js'

type MessageTree = Record<string, unknown>

const CORE_TRANSLATIONS: Record<string, MessageTree> = {
  de,
  en,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key]
    if (isRecord(existing) && isRecord(value)) {
      out[key] = deepMerge(existing, value)
    } else {
      out[key] = value
    }
  }
  return out
}

async function fetchResolvedMessages(localeCode: string): Promise<MessageTree | null> {
  try {
    const res = await fetch(`/api/v1/language-packs?locale_code=${encodeURIComponent(localeCode)}&enabled=true&resolved=true`)
    if (!res.ok) return null
    const data = await res.json() as { resolved_messages?: unknown }
    if (!isRecord(data.resolved_messages)) return null
    return data.resolved_messages
  } catch {
    return null
  }
}

export async function hydrateLocaleMessages(localeCode: string): Promise<void> {
  const core = CORE_TRANSLATIONS[localeCode] ?? {}
  const resolved = await fetchResolvedMessages(localeCode)
  const merged = resolved ? deepMerge(core, resolved) : core

  i18next.addResourceBundle(localeCode, 'translation', merged, true, true)
}

const initialLocale = resolveLocale()

// Set lang attribute immediately so HTML reflects initial locale
try {
  document.documentElement.lang = initialLocale
} catch {
  // Non-browser environment
}

void i18next.use(initReactI18next).init({
  lng: initialLocale,
  fallbackLng: 'de',
  resources: {
    de: { translation: CORE_TRANSLATIONS.de },
    en: { translation: CORE_TRANSLATIONS.en },
  },
  interpolation: {
    escapeValue: false,
  },
  saveMissing: true,
  missingKeyHandler: (lngs, _ns, key) => {
    if (typeof console !== 'undefined') {
      console.warn(`[i18n] Missing translation key: "${key}" for lang: ${lngs.join(', ')}`)
    }
  },
}).then(async () => {
  await hydrateLocaleMessages(initialLocale)
}).catch(() => {
  // Keep core messages as fallback
})

i18next.on('languageChanged', (localeCode) => {
  try {
    document.documentElement.lang = localeCode
  } catch {
    // Non-browser environment
  }

  void hydrateLocaleMessages(localeCode)
})

export { i18next as i18n }
