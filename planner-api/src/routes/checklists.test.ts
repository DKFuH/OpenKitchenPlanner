import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const projectId = '11111111-1111-1111-1111-111111111111'
const checklistId = '22222222-2222-2222-2222-222222222222'
const itemId = '33333333-3333-3333-3333-333333333333'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findUnique: vi.fn(),
    },
    installationChecklist: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    checklistItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { checklistRoutes } from './checklists.js'

const sampleChecklist = {
  id: checklistId,
  project_id: projectId,
  tenant_id: '00000000-0000-0000-0000-000000000001',
  production_order_id: null,
  title: 'Abnahmeprotokoll',
  completed_at: null,
  created_by: 'mobile-user',
  created_at: new Date('2026-03-02T08:00:00.000Z'),
  updated_at: new Date('2026-03-02T08:00:00.000Z'),
  items: [
    {
      id: itemId,
      checklist_id: checklistId,
      position: 0,
      label: 'Arbeitsplatte montiert',
      checked: false,
      photo_url: null,
      note: null,
      created_at: new Date('2026-03-02T08:00:00.000Z'),
      updated_at: new Date('2026-03-02T08:00:00.000Z'),
    },
  ],
}

describe('checklistRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create-201 (mit items)', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: sampleChecklist.tenant_id })
    prismaMock.installationChecklist.create.mockResolvedValue(sampleChecklist)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/checklists',
      payload: {
        project_id: projectId,
        created_by: 'mobile-user',
        items: [{ position: 0, label: 'Arbeitsplatte montiert', checked: false }],
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: checklistId, project_id: projectId })

    await app.close()
  })

  it('create-404', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/checklists',
      payload: {
        project_id: projectId,
        created_by: 'mobile-user',
      },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('list-200', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: sampleChecklist.tenant_id })
    prismaMock.installationChecklist.findMany.mockResolvedValue([sampleChecklist])

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/checklists`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)

    await app.close()
  })

  it('get-200', async () => {
    prismaMock.installationChecklist.findUnique.mockResolvedValue(sampleChecklist)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/checklists/${checklistId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: checklistId })

    await app.close()
  })

  it('get-404', async () => {
    prismaMock.installationChecklist.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/checklists/${checklistId}`,
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('patch-item-200', async () => {
    prismaMock.installationChecklist.findUnique.mockResolvedValue(sampleChecklist)
    prismaMock.checklistItem.findUnique.mockResolvedValue(sampleChecklist.items[0])
    prismaMock.checklistItem.update.mockResolvedValue({ ...sampleChecklist.items[0], checked: true, note: 'Geprüft' })
    prismaMock.checklistItem.findMany.mockResolvedValue([{ ...sampleChecklist.items[0], checked: true }])
    prismaMock.installationChecklist.update.mockResolvedValue({ ...sampleChecklist, completed_at: new Date('2026-03-02T09:00:00.000Z') })

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/checklists/${checklistId}/items/${itemId}`,
      payload: {
        checked: true,
        note: 'Geprüft',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: itemId, checked: true })
    expect(prismaMock.installationChecklist.update).toHaveBeenCalled()

    await app.close()
  })

  it('patch-item-404', async () => {
    prismaMock.installationChecklist.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/checklists/${checklistId}/items/${itemId}`,
      payload: {
        checked: true,
      },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('delete-204', async () => {
    prismaMock.installationChecklist.findUnique.mockResolvedValue(sampleChecklist)
    prismaMock.installationChecklist.delete.mockResolvedValue(sampleChecklist)

    const app = Fastify()
    await app.register(checklistRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/checklists/${checklistId}`,
    })

    expect(response.statusCode).toBe(204)

    await app.close()
  })
})
