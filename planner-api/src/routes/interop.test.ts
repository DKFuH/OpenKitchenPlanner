import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interopRoutes } from './interop.js'
import { tenantMiddleware } from '../tenantMiddleware.js'

const tenantId = '00000000-0000-0000-0000-000000000001'
const projectId = '11111111-1111-1111-1111-111111111111'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    project: {
      findFirst: vi.fn(),
    },
    importJob: {
      findMany: vi.fn(),
    },
    ifcImportJob: {
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../db.js', () => ({
  prisma: prismaMock,
}))

describe('interopRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.project.findFirst.mockResolvedValue({ id: projectId, tenant_id: tenantId })
    prismaMock.importJob.findMany.mockResolvedValue([
      {
        id: 'job-dxf-1',
        status: 'done',
        source_format: 'dxf',
        source_filename: 'room.dxf',
        error_message: null,
        created_at: new Date('2026-03-09T09:00:00.000Z'),
        completed_at: new Date('2026-03-09T09:01:00.000Z'),
      },
    ])
    prismaMock.ifcImportJob.findMany.mockResolvedValue([
      {
        id: 'job-ifc-1',
        status: 'done',
        filename: 'import.ifc',
        error: null,
        created_at: new Date('2026-03-09T10:00:00.000Z'),
      },
    ])
    prismaMock.document.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        project_id: projectId,
        filename: 'exported-plan.dxf',
        mime_type: 'application/dxf',
        type: 'cad_import',
        source_kind: 'import_job',
        source_id: 'job-dxf-1',
        uploaded_at: new Date('2026-03-09T09:05:00.000Z'),
        tags: ['import', 'dxf'],
      },
      {
        id: 'doc-2',
        project_id: projectId,
        filename: `alternative-${projectId}.ifc`,
        mime_type: 'application/x-step',
        type: 'other',
        source_kind: 'manual_upload',
        source_id: null,
        uploaded_at: new Date('2026-03-09T10:05:00.000Z'),
        tags: ['interop', 'ifc'],
      },
    ])
  })

  it('lists unified interop jobs for a project', async () => {
    const app = Fastify()
    await app.register(tenantMiddleware)
    await app.register(interopRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/interop/jobs`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'job-dxf-1',
          kind: 'import',
          format: 'dxf',
          filename: 'room.dxf',
        }),
        expect.objectContaining({
          id: 'job-ifc-1',
          kind: 'ifc_import',
          format: 'ifc',
          filename: 'import.ifc',
        }),
      ]),
    )

    await app.close()
  })

  it('lists unified interop artifacts for a project', async () => {
    const app = Fastify()
    await app.register(tenantMiddleware)
    await app.register(interopRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/interop/artifacts`,
      headers: { 'x-tenant-id': tenantId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'doc-1',
          format: 'dxf',
          download_url: `/api/v1/projects/${projectId}/documents/doc-1/download`,
        }),
        expect.objectContaining({
          id: 'doc-2',
          format: 'ifc',
          download_url: `/api/v1/projects/${projectId}/documents/doc-2/download`,
        }),
      ]),
    )

    await app.close()
  })

  it('returns 403 without tenant scope', async () => {
    const app = Fastify()
    await app.register(tenantMiddleware)
    await app.register(interopRoutes, { prefix: '/api/v1' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/interop/jobs`,
    })

    expect(response.statusCode).toBe(403)

    await app.close()
  })
})
