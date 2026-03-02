import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const projectId = '11111111-1111-1111-1111-111111111111'
const orderId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const purchaseOrderId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const tenantId = '00000000-0000-0000-0000-000000000001'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: { findUnique: vi.fn() },
    productionOrder: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productionOrderEvent: { create: vi.fn() },
    purchaseOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

prismaMock.$transaction.mockImplementation(
  async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock),
)

vi.mock('../db.js', () => ({ prisma: prismaMock }))

vi.mock('../services/notificationService.js', () => ({
  queueNotification: vi.fn().mockResolvedValue(null),
}))

import { productionOrderRoutes } from './productionOrders.js'

const sampleOrder = {
  id: orderId,
  project_id: projectId,
  tenant_id: tenantId,
  quote_id: null,
  bom_snapshot: {},
  status: 'draft',
  due_date: null,
  created_by: 'planer-user',
  notes: null,
  frozen_at: null,
  created_at: new Date('2026-03-02T00:00:00.000Z'),
  updated_at: new Date('2026-03-02T00:00:00.000Z'),
  events: [],
  purchase_orders: [],
}

describe('productionOrderRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock),
    )
  })

  // ─── Freeze-Status ──────────────────────────────────────────────────────

  it('returns frozen=false when no active production order exists', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: tenantId })
    prismaMock.productionOrder.findFirst.mockResolvedValue(null)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/freeze-status`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ frozen: false, production_order: null })
    await app.close()
  })

  it('returns frozen=true when a confirmed production order exists', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: tenantId })
    prismaMock.productionOrder.findFirst
      .mockResolvedValueOnce({ id: orderId }) // isProjectFrozen check
      .mockResolvedValueOnce({ id: orderId, status: 'confirmed', frozen_at: new Date() }) // detail fetch

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/freeze-status`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ frozen: true })
    await app.close()
  })

  // ─── Erstellen ──────────────────────────────────────────────────────────

  it('creates a production order for a project', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: tenantId })
    prismaMock.productionOrder.create.mockResolvedValue(sampleOrder)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/production-orders`,
      payload: { created_by: 'planer-user' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: orderId, status: 'draft' })
    await app.close()
  })

  it('returns 404 on create when project not found', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/production-orders`,
      payload: { created_by: 'user' },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('returns 400 for missing created_by', async () => {
    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/production-orders`,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  // ─── Auflisten ──────────────────────────────────────────────────────────

  it('lists production orders for a project', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: tenantId })
    prismaMock.productionOrder.findMany.mockResolvedValue([sampleOrder])

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/production-orders`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
    await app.close()
  })

  it('returns 404 on list when project not found', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/production-orders`,
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  // ─── Einzelabruf ────────────────────────────────────────────────────────

  it('gets a single production order by id', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(sampleOrder)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/production-orders/${orderId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: orderId })
    await app.close()
  })

  it('returns 404 for missing production order', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/production-orders/${orderId}`,
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  // ─── Status-Übergänge ───────────────────────────────────────────────────

  it('transitions status from draft to confirmed and sets frozen_at', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(sampleOrder)
    prismaMock.productionOrderEvent.create.mockResolvedValue({})
    prismaMock.productionOrder.update.mockResolvedValue({
      ...sampleOrder,
      status: 'confirmed',
      frozen_at: new Date(),
    })

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/production-orders/${orderId}/status`,
      payload: { status: 'confirmed', user_id: 'user-1', note: 'Auftrag bestätigt' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'confirmed' })
    expect(prismaMock.productionOrderEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from_status: 'draft', to_status: 'confirmed' }),
      }),
    )
    await app.close()
  })

  it('rejects invalid status transition (draft → in_production)', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(sampleOrder)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/production-orders/${orderId}/status`,
      payload: { status: 'in_production' },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 for unknown status value', async () => {
    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/production-orders/${orderId}/status`,
      payload: { status: 'unknown' },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  // ─── Verknüpfung PO↔ProductionOrder ─────────────────────────────────────

  it('links a purchase order to a production order', async () => {
    prismaMock.productionOrder.findUnique
      .mockResolvedValueOnce(sampleOrder) // initial check
      .mockResolvedValueOnce({ ...sampleOrder, purchase_orders: [{ id: purchaseOrderId, supplier_name: 'Nobilia', status: 'draft' }] }) // final fetch

    prismaMock.purchaseOrder.findUnique.mockResolvedValue({
      id: purchaseOrderId,
      project_id: projectId,
      status: 'draft',
    })
    prismaMock.purchaseOrder.update.mockResolvedValue({})

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/production-orders/${orderId}/link-purchase-order`,
      payload: { purchase_order_id: purchaseOrderId },
    })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.purchaseOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: purchaseOrderId },
        data: { production_order_id: orderId },
      }),
    )
    await app.close()
  })

  it('rejects linking a purchase order from a different project', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(sampleOrder)
    prismaMock.purchaseOrder.findUnique.mockResolvedValue({
      id: purchaseOrderId,
      project_id: 'other-project-id',
      status: 'draft',
    })

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/production-orders/${orderId}/link-purchase-order`,
      payload: { purchase_order_id: purchaseOrderId },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  // ─── Löschen ────────────────────────────────────────────────────────────

  it('deletes a draft production order', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(sampleOrder)
    prismaMock.productionOrder.delete.mockResolvedValue(sampleOrder)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/production-orders/${orderId}`,
    })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('rejects deleting a non-draft production order', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue({ ...sampleOrder, status: 'confirmed' })

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/production-orders/${orderId}`,
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('returns 404 when deleting non-existing production order', async () => {
    prismaMock.productionOrder.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(productionOrderRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/production-orders/${orderId}`,
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })
})
