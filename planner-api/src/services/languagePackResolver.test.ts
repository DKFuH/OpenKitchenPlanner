import { describe, expect, it } from 'vitest'
import { mergeCoreMessages, resolveLanguageMessages, resolveLanguagePackOverrides } from './languagePackResolver.js'

describe('languagePackResolver', () => {
  it('merges system then tenant overrides for same locale', () => {
    const overrides = resolveLanguagePackOverrides({
      localeCode: 'de',
      tenantId: 'tenant-a',
      packs: [
        {
          locale_code: 'de',
          scope: 'system',
          tenant_id: null,
          messages_json: { settings: { title: 'Einstellungen (System)' }, units: { mm: 'Millimeter' } },
        },
        {
          locale_code: 'de',
          scope: 'tenant',
          tenant_id: 'tenant-a',
          messages_json: { settings: { title: 'Einstellungen (Tischlerei)' } },
        },
      ],
    })

    expect(overrides).toEqual({
      settings: { title: 'Einstellungen (Tischlerei)' },
      units: { mm: 'Millimeter' },
    })
  })

  it('ignores tenant packs of other tenants', () => {
    const overrides = resolveLanguagePackOverrides({
      localeCode: 'de',
      tenantId: 'tenant-a',
      packs: [
        {
          locale_code: 'de',
          scope: 'tenant',
          tenant_id: 'tenant-b',
          messages_json: { settings: { title: 'Fremd' } },
        },
      ],
    })

    expect(overrides).toEqual({})
  })

  it('ignores disabled or invalid message packs', () => {
    const overrides = resolveLanguagePackOverrides({
      localeCode: 'de',
      tenantId: 'tenant-a',
      packs: [
        {
          locale_code: 'de',
          scope: 'system',
          tenant_id: null,
          enabled: false,
          messages_json: { common: { save: 'Speichern (aus)' } },
        },
        {
          locale_code: 'de',
          scope: 'system',
          tenant_id: null,
          messages_json: 'not-an-object',
        },
      ],
    })

    expect(overrides).toEqual({})
  })

  it('mergeCoreMessages keeps core keys and applies overrides', () => {
    const core = {
      common: { save: 'Speichern', cancel: 'Abbrechen' },
      settings: { title: 'Einstellungen' },
    }

    const merged = mergeCoreMessages(core, {
      common: { save: 'Sichern' },
      settings: { subtitle: 'Mandant' },
    })

    expect(merged).toEqual({
      common: { save: 'Sichern', cancel: 'Abbrechen' },
      settings: { title: 'Einstellungen', subtitle: 'Mandant' },
    })
  })

  it('resolveLanguageMessages applies overrides on top of core', () => {
    const resolved = resolveLanguageMessages({
      coreMessages: { common: { back: 'Zurück' }, settings: { title: 'Einstellungen' } },
      localeCode: 'de',
      tenantId: 'tenant-a',
      packs: [
        {
          locale_code: 'de',
          scope: 'tenant',
          tenant_id: 'tenant-a',
          messages_json: { settings: { title: 'Einstellungen (Custom)' } },
        },
      ],
    })

    expect(resolved).toEqual({
      common: { back: 'Zurück' },
      settings: { title: 'Einstellungen (Custom)' },
    })
  })
})
