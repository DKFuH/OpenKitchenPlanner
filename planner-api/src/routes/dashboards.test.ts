import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantId = '00000000-0000-0000-0000-000000000001'
const userId = '11111111-1111-1111-1111-111111111111'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findFirst: vi.fn(),
    },
    dashboardConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    quote: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({ prisma: prismaMock }))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { dashboardRoutes } from './dashboards.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await dashboardRoutes(instance)
  })
  return app
}

describe('dashboardRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findFirst.mockResolvedValue({ id: userId, tenant_id: tenantId })
  })

  it('returns default dashboard when no config exists', async () => {
    prismaMock.dashboardConfig.findUnique.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/dashboards/${userId}`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.user_id).toBe(userId)
    expect(body.widgets).toHaveLength(5)
    expect(body.id).toBeNull()

    await app.close()
  })

  it('upserts dashboard config for a tenant-scoped user', async () => {
    prismaMock.dashboardConfig.upsert.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      user_id: userId,
      tenant_id: tenantId,
      widgets: [{ id: 'sales_chart' }],
      layout: { columns: 12, items: [{ widget_id: 'sales_chart', x: 0, y: 0, w: 12, h: 4 }] },
      created_at: new Date('2026-03-01T10:00:00.000Z'),
      updated_at: new Date('2026-03-01T10:00:00.000Z'),
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'PUT',
      url: `/dashboards/${userId}`,
      headers: { 'x-tenant-id': tenantId },
      payload: {
        widgets: [{ id: 'sales_chart' }],
        layout: { columns: 12, items: [{ widget_id: 'sales_chart', x: 0, y: 0, w: 12, h: 4 }] },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      user_id: userId,
      tenant_id: tenantId,
    })
    expect(prismaMock.dashboardConfig.upsert).toHaveBeenCalledTimes(1)

    await app.close()
  })

  it('returns 403 for dashboard endpoints without tenant scope', async () => {
    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/dashboards/${userId}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toMatchObject({ error: 'FORBIDDEN' })

    await app.close()
  })

  it('returns 404 when user is outside tenant scope', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/dashboards/${userId}`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({ error: 'NOT_FOUND' })

    await app.close()
  })

  it('returns aggregated sales-chart KPI points', async () => {
    prismaMock.quote.findMany.mockResolvedValue([
      {
        created_at: new Date('2026-03-02T12:00:00.000Z'),
        items: [{ line_net: 1000 }, { line_net: 250 }],
      },
      {
        created_at: new Date('2026-03-03T12:00:00.000Z'),
        items: [{ line_net: 300 }],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/kpis/sales-chart?period=month',
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.period).toBe('month')
    expect(body.total_net).toBe(1550)
    expect(body.points).toHaveLength(2)

    await app.close()
  })
})
