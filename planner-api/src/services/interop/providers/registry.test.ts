import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearInteropProviders,
  getInteropProvider,
  getInteropProviders,
  listInteropCapabilities,
  registerInteropProvider,
} from './registry.js'
import type { InteropProvider } from './types.js'

describe('interop provider registry', () => {
  beforeEach(() => {
    clearInteropProviders()
  })

  it('bootstraps default providers on first access', () => {
    const providers = getInteropProviders()

    expect(providers.map((provider) => provider.format)).toEqual(['dxf', 'dwg', 'skp', 'ifc'])
    expect(getInteropProvider('dxf').getCapabilities()).toMatchObject({
      provider_id: 'core.dxf',
      provider_kind: 'embedded',
      export_delivery_mode: 'native',
    })
  })

  it('registers an additional external provider after defaults', () => {
    const provider: InteropProvider = {
      format: 'ifc',
      getCapabilities() {
        return {
          provider_id: 'external.ifc.alt',
          provider_kind: 'external',
          availability: 'experimental',
          format: 'ifc',
          import_preview: false,
          import_execute: true,
          export_artifact: true,
          native_read: true,
          native_write: true,
          review_required_by_default: false,
          artifact_kind: 'bim',
          import_delivery_mode: 'native',
          export_delivery_mode: 'native',
        }
      },
    }

    expect(() => registerInteropProvider(provider)).toThrow("Interop provider for format 'ifc' is already registered.")
  })

  it('lists enriched capabilities for built-in providers', () => {
    const capabilities = listInteropCapabilities()

    expect(capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          format: 'dwg',
          provider_id: 'core.dwg',
          artifact_kind: 'cad',
          import_delivery_mode: 'fallback',
          export_delivery_mode: 'fallback',
        }),
        expect.objectContaining({
          format: 'skp',
          provider_kind: 'embedded',
          artifact_kind: 'script',
          export_delivery_mode: 'script',
        }),
      ]),
    )
  })
})
