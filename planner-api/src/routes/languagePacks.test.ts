import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantA = 'tenant-a'
const tenantB = 'tenant-b'
const packId = '11111111-1111-1111-1111-111111111111'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    languagePack: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({ prisma: prismaMock }))

import { languagePackRoutes } from './languagePacks.js'

function fixture(overrides: Record<string, unknown> = {}) {
  return {
    id: packId,
    tenant_id: tenantA,
    locale_code: 'de',
    name: 'Tischlerei-DE',
    scope: 'tenant',
    messages_json: { settings: { title: 'Einstellungen (Custom)' } },
    enabled: true,
    created_at: '2026-03-04T10:00:00.000Z',
    updated_at: '2026-03-04T10:00:00.000Z',
    ...overrides,
  }
}

async function createApp(withTenant = true, tenantId = tenantA) {
  const app = Fastify()
  app.decorateRequest('tenantId', null)
  if (withTenant) {
    app.addHook('preHandler', async (request) => {
      request.tenantId = tenantId
    })
  }
  await app.register(languagePackRoutes, { prefix: '/api/v1' })
  return app
}

describe('languagePackRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    prismaMock.languagePack.findMany.mockResolvedValue([
      fixture({ id: 'sys-1', scope: 'system', tenant_id: null, messages_json: { settings: { title: 'Einstellungen (System)' } } }),
      fixture({ id: 'ten-1', scope: 'tenant', tenant_id: tenantA, messages_json: { settings: { title: 'Einstellungen (Tenant)' } } }),
    ])
    prismaMock.languagePack.findUnique.mockResolvedValue(fixture())
    prismaMock.languagePack.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => fixture(data))
    prismaMock.languagePack.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => fixture(data))
    prismaMock.languagePack.delete.mockResolvedValue(fixture())
  })

  it('GET /language-packs returns system and own tenant packs', async () => {
    const app = await createApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/language-packs' })

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
    expect(prismaMock.languagePack.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: [
          { scope: 'system' },
          { scope: 'tenant', tenant_id: tenantA },
        ],
      }),
    }))
    await app.close()
  })

  it('GET /language-packs?resolved=true returns merged resolved_messages', async () => {
    const app = await createApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/language-packs?locale_code=de&resolved=true' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      locale_code: 'de',
      resolved_messages: {
        settings: { title: 'Einstellungen (Tenant)' },
      },
    })
    await app.close()
  })

  it('POST /language-packs creates a tenant pack', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/language-packs',
      payload: {
        locale_code: 'EN',
        name: 'Custom EN',
        scope: 'tenant',
        messages_json: { common: { save: 'Save (Custom)' } },
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ locale_code: 'en', name: 'Custom EN', scope: 'tenant' })
    await app.close()
  })

  it('POST /language-packs rejects system scope for tenant context', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/language-packs',
      payload: {
        locale_code: 'de',
        name: 'System DE',
        scope: 'system',
        messages_json: { common: { save: 'System Save' } },
      },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('PATCH /language-packs/:id enforces tenant ownership', async () => {
    prismaMock.languagePack.findUnique.mockResolvedValue(fixture({ tenant_id: tenantB }))
    const app = await createApp()

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/language-packs/${packId}`,
      payload: { name: 'Update' },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('DELETE /language-packs/:id deletes own tenant pack', async () => {
    const app = await createApp()

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/language-packs/${packId}`,
    })

    expect(res.statusCode).toBe(204)
    expect(prismaMock.languagePack.delete).toHaveBeenCalledWith({ where: { id: packId } })
    await app.close()
  })

  it('POST /language-packs returns 403 when tenant scope is missing', async () => {
    const app = await createApp(false)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/language-packs',
      payload: {
        locale_code: 'de',
        name: 'No Tenant',
        messages_json: {},
      },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })
})
