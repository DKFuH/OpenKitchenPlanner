import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const projectId = '11111111-1111-1111-1111-111111111111'
const surveyId = '22222222-2222-2222-2222-222222222222'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findUnique: vi.fn(),
    },
    siteSurvey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

import { siteSurveyRoutes } from './siteSurveys.js'

const sampleSurvey = {
  id: surveyId,
  project_id: projectId,
  tenant_id: '00000000-0000-0000-0000-000000000001',
  measurements: { rooms: [{ name: 'Küche', width_mm: 3000, depth_mm: 4000, height_mm: 2500 }] },
  photos: [{ url: 'https://example.com/photo.jpg', caption: 'Nordwand', room_id: 'room-1' }],
  notes: 'Steckdosen prüfen',
  synced_at: null,
  created_by: 'mobile-user',
  created_at: new Date('2026-03-02T08:00:00.000Z'),
  updated_at: new Date('2026-03-02T08:00:00.000Z'),
}

describe('siteSurveyRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create-201', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: sampleSurvey.tenant_id })
    prismaMock.siteSurvey.create.mockResolvedValue(sampleSurvey)

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/site-surveys`,
      payload: {
        created_by: 'mobile-user',
        notes: 'Steckdosen prüfen',
        measurements: { rooms: [{ name: 'Küche', width_mm: 3000, depth_mm: 4000 }] },
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ id: surveyId, project_id: projectId })

    await app.close()
  })

  it('create-404-no-project', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/site-surveys`,
      payload: { created_by: 'mobile-user' },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('create-400-invalid', async () => {
    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/site-surveys`,
      payload: { created_by: '' },
    })

    expect(response.statusCode).toBe(400)

    await app.close()
  })

  it('list-200', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, tenant_id: sampleSurvey.tenant_id })
    prismaMock.siteSurvey.findMany.mockResolvedValue([sampleSurvey])

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/site-surveys`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)

    await app.close()
  })

  it('get-200', async () => {
    prismaMock.siteSurvey.findUnique.mockResolvedValue(sampleSurvey)

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/site-surveys/${surveyId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: surveyId })

    await app.close()
  })

  it('get-404', async () => {
    prismaMock.siteSurvey.findUnique.mockResolvedValue(null)

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/site-surveys/${surveyId}`,
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('delete-204', async () => {
    prismaMock.siteSurvey.findUnique.mockResolvedValue(sampleSurvey)
    prismaMock.siteSurvey.delete.mockResolvedValue(sampleSurvey)

    const app = Fastify()
    await app.register(siteSurveyRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/site-surveys/${surveyId}`,
    })

    expect(response.statusCode).toBe(204)

    await app.close()
  })
})
