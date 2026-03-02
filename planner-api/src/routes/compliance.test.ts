import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const CONTACT_ID = '11111111-1111-1111-1111-111111111111'
const PERMISSION_ID = '22222222-2222-2222-2222-222222222222'

const { txMock, prismaMock } = vi.hoisted(() => ({
  txMock: {
    lead: { deleteMany: vi.fn() },
    contact: { updateMany: vi.fn() },
  },
  prismaMock: {
    $transaction: vi.fn(),
    contact: { findFirst: vi.fn() },
    gdprDeletionRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    ssoProvider: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    rolePermission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    slaSnapshot: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { complianceRoutes } from './compliance.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await complianceRoutes(instance)
  }, { prefix: '/api/v1' })
  return app
}

describe('complianceRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock))
    txMock.lead.deleteMany.mockResolvedValue({ count: 2 })
    txMock.contact.updateMany.mockResolvedValue({ count: 1 })
  })

  it('POST /gdpr/deletion-requests -> 201', async () => {
    prismaMock.gdprDeletionRequest.create.mockResolvedValue({ id: 'req-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/gdpr/deletion-requests',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        contact_id: CONTACT_ID,
        performed_by: 'compliance-bot',
        scope: ['contacts', 'leads'],
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('POST /gdpr/deletion-requests -> 400 with empty scope', async () => {
    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/gdpr/deletion-requests',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        contact_id: CONTACT_ID,
        performed_by: 'compliance-bot',
        scope: [],
      },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('GET /gdpr/deletion-requests -> 200 array', async () => {
    prismaMock.gdprDeletionRequest.findMany.mockResolvedValue([{ id: 'req-1' }])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/gdpr/deletion-requests',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })

  it('GET /gdpr/export/:contactId -> 200 JSON', async () => {
    prismaMock.contact.findFirst.mockResolvedValue({
      id: CONTACT_ID,
      projects: [],
      leads: [],
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/gdpr/export/${CONTACT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-disposition']).toContain(`gdpr-export-${CONTACT_ID}.json`)
    await app.close()
  })

  it('GET /gdpr/export/:contactId -> 404', async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/gdpr/export/${CONTACT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('POST /sso-providers -> 201', async () => {
    prismaMock.ssoProvider.upsert.mockResolvedValue({ id: 'sso-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sso-providers',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        entity_id: 'urn:test:idp',
        sso_url: 'https://idp.example.com/sso',
        certificate: '-----BEGIN CERTIFICATE-----abcdef',
        enabled: true,
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('GET /sso-providers/current -> 200', async () => {
    prismaMock.ssoProvider.findUnique.mockResolvedValue({ id: 'sso-1', tenant_id: TENANT_ID })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/sso-providers/current',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it('GET /sso-providers/current -> 404', async () => {
    prismaMock.ssoProvider.findUnique.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/sso-providers/current',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('POST /role-permissions -> 201', async () => {
    prismaMock.rolePermission.create.mockResolvedValue({ id: PERMISSION_ID })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/role-permissions',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        role: 'admin',
        resource: 'projects',
        action: 'read',
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('GET /role-permissions -> 200 array', async () => {
    prismaMock.rolePermission.findMany.mockResolvedValue([{ id: PERMISSION_ID }])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/role-permissions',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })

  it('DELETE /role-permissions/:id -> 204', async () => {
    prismaMock.rolePermission.findUnique.mockResolvedValue({ id: PERMISSION_ID, tenant_id: TENANT_ID })
    prismaMock.rolePermission.delete.mockResolvedValue({ id: PERMISSION_ID })

    const app = makeApp()
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/role-permissions/${PERMISSION_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('GET /sla-snapshots -> 200 array', async () => {
    prismaMock.slaSnapshot.findMany.mockResolvedValue([{ id: 'sla-1' }])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/sla-snapshots',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })
})