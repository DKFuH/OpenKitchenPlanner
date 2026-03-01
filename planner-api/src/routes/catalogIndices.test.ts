import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantId = '00000000-0000-0000-0000-000000000001'
const projectId = '11111111-1111-1111-1111-111111111111'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findFirst: vi.fn(),
    },
    catalogIndex: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({ prisma: prismaMock }))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { catalogIndexRoutes } from './catalogIndices.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await catalogIndexRoutes(instance)
  })
  return app
}

describe('catalogIndexRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.project.findFirst.mockResolvedValue({ id: projectId })
  })

  it('creates a catalog index for tenant-scoped project', async () => {
    prismaMock.catalogIndex.create.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      project_id: projectId,
      catalog_id: 'nobilia-2026',
      purchase_index: 0.95,
      sales_index: 1.15,
      applied_by: 'pricing-user',
      applied_at: new Date('2026-03-01T10:00:00.000Z'),
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: `/projects/${projectId}/catalog-indices`,
      headers: { 'x-tenant-id': tenantId },
      payload: {
        catalog_id: 'nobilia-2026',
        purchase_index: 0.95,
        sales_index: 1.15,
        applied_by: 'pricing-user',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      project_id: projectId,
      catalog_id: 'nobilia-2026',
      purchase_index: 0.95,
      sales_index: 1.15,
    })

    await app.close()
  })

  it('lists catalog indices ordered by applied date desc', async () => {
    prismaMock.catalogIndex.findMany.mockResolvedValue([
      {
        id: '33333333-3333-3333-3333-333333333333',
        project_id: projectId,
        catalog_id: 'nobilia-2026',
        purchase_index: 0.97,
        sales_index: 1.12,
        applied_by: 'pricing-user',
        applied_at: new Date('2026-03-01T11:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/projects/${projectId}/catalog-indices`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
    expect(prismaMock.catalogIndex.findMany).toHaveBeenCalledWith({
      where: { project_id: projectId },
      orderBy: { applied_at: 'desc' },
      select: expect.any(Object),
    })

    await app.close()
  })

  it('returns 403 without tenant scope', async () => {
    const app = makeApp()

    const response = await app.inject({
      method: 'GET',
      url: `/projects/${projectId}/catalog-indices`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toMatchObject({ error: 'FORBIDDEN' })

    await app.close()
  })

  it('returns 404 when project is outside tenant scope', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null)

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: `/projects/${projectId}/catalog-indices`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({ error: 'NOT_FOUND' })

    await app.close()
  })
})
