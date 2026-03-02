import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const connectorId = '11111111-1111-1111-1111-111111111111'
const orderId = '22222222-2222-2222-2222-222222222222'

const sampleConnector = {
  id: connectorId,
  tenant_id: '00000000-0000-0000-0000-000000000001',
  name: 'Nobilia ERP',
  endpoint: 'https://erp.example.com/orders',
  auth_config: { type: 'bearer', token: 'secret-token' },
  field_mapping: { supplier_ref: 'erp_order_number' },
  enabled: true,
  created_at: new Date('2026-03-02T09:00:00.000Z'),
  updated_at: new Date('2026-03-02T09:00:00.000Z'),
}

const sampleOrder = {
  id: orderId,
  supplier_name: 'Nobilia GmbH',
  supplier_ref: 'NB-001',
  items: [],
  erp_order_ref: null,
  erp_connector_id: null,
  status: 'draft',
}

const { prismaMock, pushToErpMock } = vi.hoisted(() => ({
  prismaMock: {
    erpConnector: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    purchaseOrder: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  pushToErpMock: vi.fn().mockResolvedValue({
    success: true,
    erp_order_ref: 'ERP-001',
    error: null,
  }),
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../services/erpPushService.js', () => ({
  pushToErp: pushToErpMock,
}))

import { erpConnectorRoutes } from './erpConnectors.js'

describe('erpConnectorRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushToErpMock.mockResolvedValue({ success: true, erp_order_ref: 'ERP-001', error: null })
  })

  it('POST /erp-connectors -> 201', async () => {
    prismaMock.erpConnector.create.mockResolvedValue(sampleConnector)

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    app.addHook('preHandler', async (request) => {
      request.tenantId = sampleConnector.tenant_id
    })
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/erp-connectors',
      payload: { name: 'Nobilia ERP', endpoint: 'https://erp.example.com/orders' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: connectorId })

    await app.close()
  })

  it('POST /erp-connectors -> 400 invalid URL', async () => {
    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/erp-connectors',
      payload: { name: 'Nobilia ERP', endpoint: 'not-a-url' },
    })

    expect(response.statusCode).toBe(400)

    await app.close()
  })

  it('GET /erp-connectors -> 200 array', async () => {
    prismaMock.erpConnector.findMany.mockResolvedValue([sampleConnector])

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    app.addHook('preHandler', async (request) => {
      request.tenantId = sampleConnector.tenant_id
    })
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({ method: 'GET', url: '/api/v1/erp-connectors' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)

    await app.close()
  })

  it('GET /erp-connectors/:id -> 200', async () => {
    prismaMock.erpConnector.findUnique.mockResolvedValue(sampleConnector)

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({ method: 'GET', url: `/api/v1/erp-connectors/${connectorId}` })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: connectorId })

    await app.close()
  })

  it('GET /erp-connectors/:id -> 404', async () => {
    prismaMock.erpConnector.findUnique.mockResolvedValue(null)

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({ method: 'GET', url: `/api/v1/erp-connectors/${connectorId}` })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('PUT /erp-connectors/:id -> 200', async () => {
    prismaMock.erpConnector.findUnique.mockResolvedValue(sampleConnector)
    prismaMock.erpConnector.update.mockResolvedValue({ ...sampleConnector, name: 'Updated ERP' })

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/erp-connectors/${connectorId}`,
      payload: { name: 'Updated ERP' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ name: 'Updated ERP' })

    await app.close()
  })

  it('DELETE /erp-connectors/:id -> 204', async () => {
    prismaMock.erpConnector.findUnique.mockResolvedValue(sampleConnector)
    prismaMock.erpConnector.delete.mockResolvedValue(sampleConnector)

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({ method: 'DELETE', url: `/api/v1/erp-connectors/${connectorId}` })

    expect(response.statusCode).toBe(204)

    await app.close()
  })

  it('POST /purchase-orders/:id/push-to-erp -> 404 no purchase order', async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(null)

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${orderId}/push-to-erp`,
      payload: { connector_id: connectorId },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('POST /purchase-orders/:id/push-to-erp -> 400 disabled connector', async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(sampleOrder)
    prismaMock.erpConnector.findUnique.mockResolvedValue({ ...sampleConnector, enabled: false })

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${orderId}/push-to-erp`,
      payload: { connector_id: connectorId },
    })

    expect(response.statusCode).toBe(400)

    await app.close()
  })

  it('POST /erp-webhook/:connectorId -> 200 with erp_order_ref + status', async () => {
    prismaMock.purchaseOrder.findFirst.mockResolvedValue({ ...sampleOrder, erp_order_ref: 'ERP-001', erp_connector_id: connectorId })
    prismaMock.purchaseOrder.update.mockResolvedValue({ ...sampleOrder, status: 'confirmed' })

    const app = Fastify()
    app.decorateRequest('tenantId', null)
    await app.register(erpConnectorRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/erp-webhook/${connectorId}`,
      payload: { erp_order_ref: 'ERP-001', status: 'confirmed' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ received: true })
    expect(prismaMock.purchaseOrder.update).toHaveBeenCalled()

    await app.close()
  })
})
