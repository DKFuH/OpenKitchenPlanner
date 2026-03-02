import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const REPORT_ID = '11111111-1111-1111-1111-111111111111'
const SCHEDULE_ID = '22222222-2222-2222-2222-222222222222'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: { findMany: vi.fn() },
    reportDefinition: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    reportSchedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    reportRun: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { reportRoutes } from './reports.js'

const reportFixture = {
  id: REPORT_ID,
  tenant_id: TENANT_ID,
  name: 'Umsatzreport',
  description: null,
  dimensions: ['period'],
  metrics: ['revenue'],
  filters: {},
  created_by: 'user-1',
  created_at: new Date('2026-03-02T10:00:00.000Z'),
  updated_at: new Date('2026-03-02T10:00:00.000Z'),
}

const scheduleFixture = {
  id: SCHEDULE_ID,
  report_definition_id: REPORT_ID,
  cron_expression: '0 8 * * 1',
  recipients: ['mail@example.com'],
  format: 'pdf',
  enabled: true,
  last_run_at: null,
  created_at: new Date('2026-03-02T10:00:00.000Z'),
  updated_at: new Date('2026-03-02T10:00:00.000Z'),
}

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await reportRoutes(instance)
  }, { prefix: '/api/v1' })
  return app
}

describe('reportRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /reports -> 201 with valid payload', async () => {
    prismaMock.reportDefinition.create.mockResolvedValue(reportFixture)

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        tenant_id: TENANT_ID,
        name: 'Umsatzreport',
        dimensions: ['period'],
        metrics: ['revenue'],
        filters: {},
        created_by: 'user-1',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: REPORT_ID, name: 'Umsatzreport' })
    await app.close()
  })

  it('POST /reports -> 400 without name', async () => {
    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        tenant_id: TENANT_ID,
        dimensions: ['period'],
        metrics: ['revenue'],
        filters: {},
      },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('GET /reports -> 200 array', async () => {
    prismaMock.reportDefinition.findMany.mockResolvedValue([reportFixture])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })

  it('GET /reports/:id -> 200', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/reports/${REPORT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: REPORT_ID })
    await app.close()
  })

  it('GET /reports/:id -> 404', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/reports/${REPORT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(404)
    await app.close()
  })

  it('PUT /reports/:id -> 200', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })
    prismaMock.reportDefinition.update.mockResolvedValue({ ...reportFixture, name: 'Aktualisiert' })

    const app = makeApp()
    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/reports/${REPORT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
      payload: { name: 'Aktualisiert' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().name).toBe('Aktualisiert')
    await app.close()
  })

  it('DELETE /reports/:id -> 204', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })
    prismaMock.reportDefinition.delete.mockResolvedValue(reportFixture)

    const app = makeApp()
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/reports/${REPORT_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('GET /reports/builtin/revenue-by-period -> 200 with rows array', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      { created_at: '2026-01-10T00:00:00.000Z', quote_value: 1000 },
      { created_at: '2026-01-20T00:00:00.000Z', quote_value: 500 },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/builtin/revenue-by-period?period=last_30_days',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json().rows)).toBe(true)
    await app.close()
  })

  it('GET /reports/builtin/lead-funnel -> 200 with stages array', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      { project_status: 'lead' },
      { project_status: 'quoted' },
      { project_status: 'quoted' },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/builtin/lead-funnel',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json().stages)).toBe(true)
    await app.close()
  })

  it('GET /reports/builtin/sales-ranking -> 200 with rows array', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      { assigned_to: 'Anna M.', quote_value: 1000 },
      { assigned_to: 'Anna M.', quote_value: 500 },
      { assigned_to: 'Ben K.', quote_value: 250 },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/builtin/sales-ranking',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json().rows)).toBe(true)
    await app.close()
  })

  it('POST /reports/:id/schedules -> 201', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })
    prismaMock.reportSchedule.create.mockResolvedValue(scheduleFixture)

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/reports/${REPORT_ID}/schedules`,
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        cron_expression: '0 8 * * 1',
        recipients: ['mail@example.com'],
        format: 'pdf',
      },
    })

    expect(response.statusCode).toBe(201)
    await app.close()
  })

  it('POST /reports/:id/schedules -> 400 invalid cron', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/reports/${REPORT_ID}/schedules`,
      headers: { 'x-tenant-id': TENANT_ID },
      payload: {
        cron_expression: '* *',
        recipients: ['mail@example.com'],
        format: 'pdf',
      },
    })

    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('DELETE /reports/:reportId/schedules/:scheduleId -> 204', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })
    prismaMock.reportSchedule.findUnique.mockResolvedValue(scheduleFixture)
    prismaMock.reportSchedule.delete.mockResolvedValue(scheduleFixture)

    const app = makeApp()
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/reports/${REPORT_ID}/schedules/${SCHEDULE_ID}`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(204)
    await app.close()
  })

  it('POST /reports/:id/run -> 201 with status=done', async () => {
    prismaMock.reportDefinition.findUnique.mockResolvedValue({ ...reportFixture, schedules: [] })
    prismaMock.reportRun.create.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      tenant_id: TENANT_ID,
      report_name: 'Umsatzreport',
      generated_at: new Date('2026-03-02T10:00:00.000Z'),
      file_url: null,
      status: 'done',
      error: null,
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/reports/${REPORT_ID}/run`,
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().status).toBe('done')
    await app.close()
  })

  it('GET /reports/runs -> 200 array', async () => {
    prismaMock.reportRun.findMany.mockResolvedValue([
      {
        id: '33333333-3333-3333-3333-333333333333',
        tenant_id: TENANT_ID,
        report_name: 'Umsatzreport',
        generated_at: new Date('2026-03-02T10:00:00.000Z'),
        file_url: null,
        status: 'done',
        error: null,
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/runs',
      headers: { 'x-tenant-id': TENANT_ID },
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.json())).toBe(true)
    await app.close()
  })
})
