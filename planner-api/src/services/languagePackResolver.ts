export type MessageTree = Record<string, unknown>

export type LanguagePackLike = {
  id?: string
  tenant_id?: string | null
  locale_code: string
  scope: string
  messages_json: unknown
  enabled?: boolean
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneTree(tree: MessageTree): MessageTree {
  return JSON.parse(JSON.stringify(tree)) as MessageTree
}

function deepMerge(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const existing = out[key]
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMerge(existing, value)
    } else {
      out[key] = value
    }
  }

  return out
}

function normalizeMessagesJson(value: unknown): MessageTree | null {
  if (!isPlainObject(value)) return null
  return value
}

export function resolveLanguagePackOverrides(input: {
  localeCode: string
  tenantId?: string | null
  packs: LanguagePackLike[]
}): MessageTree {
  const { localeCode, tenantId, packs } = input

  const activeForLocale = packs.filter((pack) => (
    (pack.enabled ?? true)
    && pack.locale_code === localeCode
    && (pack.scope === 'system' || pack.scope === 'tenant')
  ))

  const system = activeForLocale.filter((pack) => pack.scope === 'system')
  const tenant = activeForLocale.filter((pack) => pack.scope === 'tenant' && pack.tenant_id === (tenantId ?? null))

  const ordered = [...system, ...tenant]

  return ordered.reduce<MessageTree>((acc, pack) => {
    const messages = normalizeMessagesJson(pack.messages_json)
    if (!messages) return acc
    return deepMerge(acc, messages)
  }, {})
}

export function mergeCoreMessages(coreMessages: MessageTree, overrides: MessageTree): MessageTree {
  return deepMerge(cloneTree(coreMessages), overrides)
}

export function resolveLanguageMessages(input: {
  coreMessages: MessageTree
  localeCode: string
  tenantId?: string | null
  packs: LanguagePackLike[]
}): MessageTree {
  const overrides = resolveLanguagePackOverrides({
    localeCode: input.localeCode,
    tenantId: input.tenantId,
    packs: input.packs,
  })
  return mergeCoreMessages(input.coreMessages, overrides)
}
