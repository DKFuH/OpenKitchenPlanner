import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tenantId = '00000000-0000-0000-0000-000000000001'

const { prismaMock, createDailyTenantBackupMock, queueNotificationMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findMany: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
  },
  createDailyTenantBackupMock: vi.fn(),
  queueNotificationMock: vi.fn(),
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

vi.mock('../services/backupService.js', () => ({
  createDailyTenantBackup: createDailyTenantBackupMock,
}))

vi.mock('../services/notificationService.js', () => ({
  queueNotification: queueNotificationMock,
}))

import { tenantMiddleware } from '../tenantMiddleware.js'
import { platformRoutes } from './platform.js'

function makeApp() {
  const app = Fastify()
  app.register(async (instance) => {
    await tenantMiddleware(instance)
    await platformRoutes(instance)
  })
  return app
}

describe('platformRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tenant-scoped global search results', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Musterküche',
        description: 'Familie Nord',
        project_status: 'planning',
        updated_at: new Date('2026-03-01T10:00:00.000Z'),
      },
    ])
    prismaMock.contact.findMany.mockResolvedValue([
      {
        id: 'contact-1',
        first_name: 'Max',
        last_name: 'Mustermann',
        company: null,
        email: 'max@example.de',
        updated_at: new Date('2026-03-01T10:00:00.000Z'),
      },
    ])
    prismaMock.document.findMany.mockResolvedValue([
      {
        id: 'document-1',
        filename: 'angebot.pdf',
        type: 'quote_pdf',
        project_id: 'project-1',
        uploaded_at: new Date('2026-03-01T10:00:00.000Z'),
        tags: ['quote'],
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/search?q=mus',
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().results).toHaveLength(3)
    expect(response.json().results[0]).toMatchObject({ type: 'project' })

    await app.close()
  })

  it('queues email notifications via webhook endpoint', async () => {
    queueNotificationMock.mockResolvedValue({ id: 'notification-1' })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/webhooks/email-notifications',
      headers: { 'x-tenant-id': tenantId },
      payload: {
        event_type: 'custom',
        entity_type: 'document',
        entity_id: 'document-1',
        recipient_email: 'alerts@example.de',
        subject: 'Dokument aktualisiert',
        message: 'Ein Dokument wurde aktualisiert.',
      },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({
      status: 'queued',
      notification_id: 'notification-1',
    })

    await app.close()
  })

  it('exports project lists as csv', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Musterküche',
        project_status: 'planning',
        priority: 'high',
        assigned_to: 'Studio',
        deadline: new Date('2026-03-15T00:00:00.000Z'),
        progress_pct: 45,
        quote_value: 18000,
        updated_at: new Date('2026-03-01T10:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/projects/export-csv',
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.body).toContain('project_status')
    expect(response.body).toContain('Musterküche')

    await app.close()
  })

  it('exports contact lists as csv', async () => {
    prismaMock.contact.findMany.mockResolvedValue([
      {
        id: 'contact-1',
        first_name: 'Max',
        last_name: 'Mustermann',
        company: 'Muster GmbH',
        email: 'max@example.de',
        phone: '01234',
        lead_source: 'web_planner',
        budget_estimate: 15000,
        updated_at: new Date('2026-03-01T10:00:00.000Z'),
      },
    ])

    const app = makeApp()
    const response = await app.inject({
      method: 'GET',
      url: '/contacts/export-csv',
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toContain('Mustermann')
    expect(response.body).toContain('web_planner')

    await app.close()
  })

  it('creates a daily backup snapshot for a tenant', async () => {
    createDailyTenantBackupMock.mockResolvedValue({
      id: 'backup-1',
      tenant_id: tenantId,
      storage_key: 'tenant/backups/backup.json',
      entity_count: 4,
      triggered_by: 'system:daily-backup',
    })

    const app = makeApp()
    const response = await app.inject({
      method: 'POST',
      url: '/backups/run-daily',
      headers: { 'x-tenant-id': tenantId },
      payload: {},
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      id: 'backup-1',
      tenant_id: tenantId,
    })

    await app.close()
  })
})
