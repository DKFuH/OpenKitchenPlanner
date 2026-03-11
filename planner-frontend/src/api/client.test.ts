import { afterEach, describe, expect, it } from 'vitest'
import { shouldUseDemoFallback } from './client.js'

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
})

describe('shouldUseDemoFallback', () => {
  it('stays disabled without explicit demo mode', () => {
    expect(shouldUseDemoFallback(new Error('Failed to fetch'))).toBe(false)
  })

  it('allows fallback for supported backend failures when demo mode is explicitly enabled', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => key === 'okp-demo-mode' ? 'true' : null,
        },
      },
    })

    expect(shouldUseDemoFallback(new Error('Internal Server Error'))).toBe(true)
  })

  it('keeps unrelated errors visible even in explicit demo mode', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => 'true',
        },
      },
    })

    expect(shouldUseDemoFallback(new Error('Validation failed'))).toBe(false)
  })
})
