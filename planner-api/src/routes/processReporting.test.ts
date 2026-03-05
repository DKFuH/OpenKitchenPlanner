import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const ORDER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const PROJECT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    productionOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    workflowInstance: {
      findMany: vi.fn(),
    },
    workflowEvent: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { processReportingRoutes } from './processReporting.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await processReportingRoutes(instance)
  })
  return app
}

function authHeaders() {
  return {
    'x-tenant-id': TENANT_ID,
  }
}

describe('processReportingRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns process KPIs', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        created_at: new Date('2026-03-01T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        project_status: 'quoted',
      },
    ])
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        project_id: PROJECT_ID,
        status: 'in_production',
        created_at: new Date('2026-03-02T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        events: [
          {
            from_status: 'confirmed',
            to_status: 'in_production',
            note: null,
            created_at: new Date('2026-03-03T00:00:00.000Z'),
          },
        ],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/reports/process/kpis',
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().kpis).toMatchObject({
      total_orders: 1,
    })

    await app.close()
  })

  it('returns bottlenecks', async () => {
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        project_id: PROJECT_ID,
        status: 'confirmed',
        created_at: new Date('2026-03-02T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        events: [],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/reports/process/bottlenecks',
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json().bottlenecks)).toBe(true)

    await app.close()
  })

  it('returns production-order timeline', async () => {
    prismaMock.productionOrder.findFirst.mockResolvedValue({
      id: ORDER_ID,
      created_at: new Date('2026-03-01T00:00:00.000Z'),
      events: [
        {
          from_status: 'draft',
          to_status: 'confirmed',
          note: 'ok',
          user_id: 'u1',
          created_at: new Date('2026-03-02T00:00:00.000Z'),
        },
      ],
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/reports/process/timeline/${ORDER_ID}`,
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ entity_type: 'production_order', entity_id: ORDER_ID })

    await app.close()
  })

  it('returns project timeline with workflow and order events', async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      id: PROJECT_ID,
      created_at: new Date('2026-03-01T00:00:00.000Z'),
    })
    prismaMock.workflowInstance.findMany.mockResolvedValue([{ id: 'instance-1' }])
    prismaMock.workflowEvent.findMany.mockResolvedValue([
      {
        id: 'wf-1',
        created_at: new Date('2026-03-02T00:00:00.000Z'),
        from_node_id: 'lead',
        to_node_id: 'quoted',
        transition_label: 'quote',
        reason: null,
      },
    ])
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        created_at: new Date('2026-03-03T00:00:00.000Z'),
        events: [],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/reports/process/timeline/${PROJECT_ID}?entity_type=project`,
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ entity_type: 'project', entity_id: PROJECT_ID })

    await app.close()
  })

  it('returns process dashboard overview', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        created_at: new Date('2026-03-01T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        project_status: 'contract',
      },
    ])
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        project_id: PROJECT_ID,
        status: 'confirmed',
        created_at: new Date('2026-03-02T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        events: [],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/dashboards/process/overview',
      headers: authHeaders(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('kpis')
    expect(response.json()).toHaveProperty('bottlenecks')

    await app.close()
  })

  it('exports process report as csv and pdf payload', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        created_at: new Date('2026-03-01T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        project_status: 'quoted',
      },
    ])
    prismaMock.productionOrder.findMany.mockResolvedValue([
      {
        id: ORDER_ID,
        project_id: PROJECT_ID,
        status: 'confirmed',
        created_at: new Date('2026-03-02T00:00:00.000Z'),
        updated_at: new Date('2026-03-05T00:00:00.000Z'),
        events: [],
      },
    ])

    const app = makeApp()

    const csvResponse = await app.inject({
      method: 'POST',
      url: '/reports/process/export',
      headers: authHeaders(),
      payload: { format: 'csv' },
    })

    expect(csvResponse.statusCode).toBe(200)
    expect(csvResponse.json()).toMatchObject({ format: 'csv', mime_type: 'text/csv' })

    const pdfResponse = await app.inject({
      method: 'POST',
      url: '/reports/process/export',
      headers: authHeaders(),
      payload: { format: 'pdf' },
    })

    expect(pdfResponse.statusCode).toBe(200)
    expect(pdfResponse.json()).toMatchObject({ format: 'pdf', mime_type: 'application/pdf' })

    await app.close()
  })
})
