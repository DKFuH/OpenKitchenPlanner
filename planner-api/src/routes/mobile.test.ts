import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const USER_ID = '11111111-1111-1111-1111-111111111111'
const USER_EMAIL = 'mobile.user@example.com'
const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    project: {
      findMany: vi.fn(),
    },
    productionOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    productionOrderEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    notificationEvent: {
      findMany: vi.fn(),
    },
  },
}))

prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => callback(prismaMock))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../services/notificationService.js', () => ({
  queueNotification: vi.fn().mockResolvedValue(null),
}))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { mobileRoutes } from './mobile.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await mobileRoutes(instance)
  })
  return app
}

function authHeaders() {
  return {
    'x-tenant-id': TENANT_ID,
    'x-user-id': USER_ID,
    'x-user-email': USER_EMAIL,
  }
}

describe('mobileRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.project.findMany.mockResolvedValue([])
    prismaMock.productionOrder.findMany.mockResolvedValue([])
    prismaMock.productionOrderEvent.findMany.mockResolvedValue([])
    prismaMock.notificationEvent.findMany.mockResolvedValue([])
  })

  it('returns mobile dashboard summary', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Projekt Nord',
        project_status: 'quoted',
        progress_pct: 40,
        updated_at: new Date('2026-03-05T08:00:00.000Z'),
      },
    ])
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        status: 'confirmed',
        due_date: new Date('2026-03-08T08:00:00.000Z'),
        updated_at: new Date('2026-03-05T08:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/mobile/me/dashboard',
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      user_id: USER_ID,
      assigned_projects: 1,
      active_orders: 1,
    })

    await app.close()
  })

  it('returns production order status for mobile view', async () => {
    prismaMock.productionOrder.findFirst.mockResolvedValue({
      id: ORDER_ID,
      status: 'confirmed',
      due_date: null,
      frozen_at: new Date('2026-03-05T08:00:00.000Z'),
      notes: null,
      updated_at: new Date('2026-03-05T08:00:00.000Z'),
      project: {
        id: 'project-1',
        name: 'Projekt Nord',
        project_status: 'contract',
        progress_pct: 60,
      },
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/mobile/orders/${ORDER_ID}/status`,
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: ORDER_ID,
      status: 'confirmed',
      project: expect.objectContaining({ id: 'project-1' }),
    })

    await app.close()
  })

  it('returns mobile order timeline', async () => {
    prismaMock.productionOrder.findFirst.mockResolvedValue({
      id: ORDER_ID,
      status: 'confirmed',
      created_at: new Date('2026-03-05T07:00:00.000Z'),
    })
    prismaMock.productionOrderEvent.findMany.mockResolvedValue([
      {
        id: 'event-1',
        production_order_id: ORDER_ID,
        from_status: 'draft',
        to_status: 'confirmed',
        user_id: USER_ID,
        note: 'Step done',
        created_at: new Date('2026-03-05T08:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/mobile/orders/${ORDER_ID}/timeline`,
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().timeline).toHaveLength(2)

    await app.close()
  })

  it('confirms a mobile step and updates production order status', async () => {
    prismaMock.productionOrder.findFirst.mockResolvedValue({
      id: ORDER_ID,
      status: 'draft',
      tenant_id: TENANT_ID,
      frozen_at: null,
    })
    prismaMock.productionOrderEvent.create.mockResolvedValue({ id: 'event-1' })
    prismaMock.productionOrder.update.mockResolvedValue({
      id: ORDER_ID,
      status: 'confirmed',
      frozen_at: new Date('2026-03-05T08:00:00.000Z'),
      updated_at: new Date('2026-03-05T08:00:00.000Z'),
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/mobile/orders/${ORDER_ID}/actions/confirm-step`,
      headers: authHeaders(),
      payload: {
        to_status: 'confirmed',
        note: 'Confirmed from mobile',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: ORDER_ID,
      status: 'confirmed',
    })

    await app.close()
  })

  it('reports a mobile issue as production order event', async () => {
    prismaMock.productionOrder.findFirst.mockResolvedValue({
      id: ORDER_ID,
      status: 'in_production',
    })
    prismaMock.productionOrderEvent.create.mockResolvedValue({
      id: 'event-issue-1',
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/mobile/orders/${ORDER_ID}/actions/report-issue`,
      headers: authHeaders(),
      payload: {
        note: 'Material delayed',
        severity: 'high',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ reported: true, event_id: 'event-issue-1' })

    await app.close()
  })

  it('lists mobile notifications for user email', async () => {
    prismaMock.notificationEvent.findMany.mockResolvedValue([
      {
        id: 'notification-1',
        tenant_id: TENANT_ID,
        recipient_email: USER_EMAIL,
        subject: 'Test',
        message: 'Test message',
        created_at: new Date('2026-03-05T09:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/mobile/notifications?limit=20',
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ count: 1 })
    expect(prismaMock.notificationEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
          recipient_email: USER_EMAIL,
        }),
      }),
    )

    await app.close()
  })
})
