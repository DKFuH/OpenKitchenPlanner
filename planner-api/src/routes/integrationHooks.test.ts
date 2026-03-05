import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const ENDPOINT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const OUTBOX_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    integrationEndpoint: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    integrationMappingProfile: {
      create: vi.fn(),
    },
    integrationOutboxMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    integrationDeliveryAttempt: {
      create: vi.fn(),
    },
  },
}))

prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => callback(prismaMock))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { integrationHooksRoutes } from './integrationHooks.js'

function makeApp() {
  const app = Fastify()
  app.register(integrationHooksRoutes, { prefix: '/api/v1' })
  return app
}

function tenantHeaders() {
  return {
    'x-tenant-id': TENANT_ID,
  }
}

describe('integrationHooksRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => callback(prismaMock))
  })

  it('creates integration endpoint and optional mapping profile', async () => {
    prismaMock.integrationEndpoint.create.mockResolvedValue({
      id: ENDPOINT_ID,
      tenant_id: TENANT_ID,
      name: 'DATEV API',
      provider: 'datev',
      endpoint_url: 'https://api.datev.local/hooks',
      dry_run: true,
      is_active: true,
    })
    prismaMock.integrationMappingProfile.create.mockResolvedValue({ id: 'profile-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/integrations/endpoints',
      headers: tenantHeaders(),
      payload: {
        name: 'DATEV API',
        provider: 'datev',
        endpoint_url: 'https://api.datev.local/hooks',
        dry_run: true,
        mapping_profile: {
          name: 'default-datev',
          config_json: { invoice_no: 'belegnummer' },
        },
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: ENDPOINT_ID, provider: 'datev' })

    await app.close()
  })

  it('lists integration endpoints in tenant scope', async () => {
    prismaMock.integrationEndpoint.findMany.mockResolvedValue([
      {
        id: ENDPOINT_ID,
        tenant_id: TENANT_ID,
        provider: 'datev',
        name: 'DATEV API',
        mapping_profiles: [],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/endpoints',
      headers: tenantHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)

    await app.close()
  })

  it('tests an endpoint by creating outbox message', async () => {
    prismaMock.integrationEndpoint.findFirst.mockResolvedValue({
      id: ENDPOINT_ID,
      tenant_id: TENANT_ID,
      dry_run: true,
    })
    prismaMock.integrationOutboxMessage.create.mockResolvedValue({ id: OUTBOX_ID })
    prismaMock.integrationDeliveryAttempt.create.mockResolvedValue({ id: 'attempt-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/integrations/endpoints/${ENDPOINT_ID}/test`,
      headers: tenantHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      ok: true,
      endpoint_id: ENDPOINT_ID,
      outbox_id: OUTBOX_ID,
      mode: 'dry_run',
    })

    await app.close()
  })

  it('lists and replays outbox messages', async () => {
    prismaMock.integrationOutboxMessage.findMany.mockResolvedValue([
      {
        id: OUTBOX_ID,
        tenant_id: TENANT_ID,
        status: 'pending',
      },
    ])
    prismaMock.integrationOutboxMessage.findFirst.mockResolvedValue({
      id: OUTBOX_ID,
      tenant_id: TENANT_ID,
      attempt_count: 1,
      delivered_at: null,
      endpoint: {
        dry_run: false,
      },
    })
    prismaMock.integrationDeliveryAttempt.create.mockResolvedValue({ id: 'attempt-2' })
    prismaMock.integrationOutboxMessage.update.mockResolvedValue({
      id: OUTBOX_ID,
      status: 'pending',
      attempt_count: 2,
    })

    const app = makeApp()

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/outbox?status=pending',
      headers: tenantHeaders(),
    })

    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.json()).toHaveLength(1)

    const replayResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/integrations/outbox/${OUTBOX_ID}/replay`,
      headers: tenantHeaders(),
    })

    expect(replayResponse.statusCode).toBe(200)
    expect(replayResponse.json()).toMatchObject({ id: OUTBOX_ID, attempt_count: 2 })

    await app.close()
  })

  it('accepts inbound provider payload and creates outbox entries', async () => {
    prismaMock.integrationEndpoint.findMany.mockResolvedValue([
      { id: ENDPOINT_ID, dry_run: false },
    ])
    prismaMock.integrationOutboxMessage.create.mockResolvedValue({ id: OUTBOX_ID })
    prismaMock.integrationDeliveryAttempt.create.mockResolvedValue({ id: 'attempt-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/integrations/inbound/datev',
      headers: tenantHeaders(),
      payload: {
        event_type: 'invoice_booked',
        payload_json: { invoice_no: 'R-1000' },
        idempotency_key: 'invoice-R-1000',
      },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toMatchObject({
      received: true,
      provider: 'datev',
      endpoint_count: 1,
    })

    await app.close()
  })

  it('returns delivery details with attempts', async () => {
    prismaMock.integrationOutboxMessage.findFirst.mockResolvedValue({
      id: OUTBOX_ID,
      tenant_id: TENANT_ID,
      status: 'delivered',
      endpoint: {
        id: ENDPOINT_ID,
        name: 'DATEV API',
        provider: 'datev',
        endpoint_url: 'https://api.datev.local/hooks',
        dry_run: true,
      },
      attempts: [
        {
          id: 'attempt-1',
          attempt_no: 1,
          http_status: 200,
        },
      ],
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/integrations/deliveries/${OUTBOX_ID}`,
      headers: tenantHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: OUTBOX_ID, status: 'delivered' })

    await app.close()
  })
})
