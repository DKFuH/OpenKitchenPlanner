import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'

const documentTypeValues = ['quote_pdf', 'render_image', 'cad_import', 'email', 'contract', 'other'] as const

const DocumentParamsSchema = z.object({
  id: z.string().uuid(),
})

const DocumentDeleteParamsSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
})

const DocumentListQuerySchema = z.object({
  type: z.enum(documentTypeValues).optional(),
  tag: z.string().min(1).max(100).optional(),
})

const CreateDocumentSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(255),
  size_bytes: z.number().int().min(0),
  uploaded_by: z.string().min(1).max(200),
  type: z.enum(documentTypeValues),
  tags: z.array(z.string().min(1).max(100)).default([]),
  is_public: z.boolean().optional(),
})

const documentSelect = {
  id: true,
  project_id: true,
  tenant_id: true,
  filename: true,
  mime_type: true,
  size_bytes: true,
  uploaded_by: true,
  uploaded_at: true,
  type: true,
  tags: true,
  is_public: true,
} as const

const prismaDocument = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
  deleteMany: (args: unknown) => Promise<{ count: number }>
}>).document

function getTenantId(request: { tenantId?: string | null; headers?: Record<string, string | string[] | undefined> }): string | null {
  if (request.tenantId) {
    return request.tenantId
  }

  const headerValue = request.headers?.['x-tenant-id']
  if (!headerValue) {
    return null
  }

  return Array.isArray(headerValue) ? (headerValue[0] ?? null) : headerValue
}

async function assertProjectInTenantScope(projectId: string, tenantId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, tenant_id: tenantId },
    select: { id: true, tenant_id: true },
  })
}

export async function documentRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/projects/:id/documents', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsedParams = DocumentParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return sendBadRequest(reply, parsedParams.error.errors[0]?.message ?? 'Invalid project id')
    }

    const parsedBody = CreateDocumentSchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Invalid payload')
    }

    const project = await assertProjectInTenantScope(parsedParams.data.id, tenantId)
    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const document = await prismaDocument.create({
      data: {
        project_id: parsedParams.data.id,
        tenant_id: tenantId,
        filename: parsedBody.data.filename,
        mime_type: parsedBody.data.mime_type,
        size_bytes: parsedBody.data.size_bytes,
        uploaded_by: parsedBody.data.uploaded_by,
        type: parsedBody.data.type,
        tags: parsedBody.data.tags,
        is_public: parsedBody.data.is_public ?? false,
      },
      select: documentSelect,
    })

    return reply.status(201).send(document)
  })

  app.get<{ Params: { id: string }; Querystring: { type?: typeof documentTypeValues[number]; tag?: string } }>(
    '/projects/:id/documents',
    async (request, reply) => {
      const tenantId = getTenantId(request)
      if (!tenantId) {
        return sendForbidden(reply, 'Tenant scope is required')
      }

      const parsedParams = DocumentParamsSchema.safeParse(request.params)
      if (!parsedParams.success) {
        return sendBadRequest(reply, parsedParams.error.errors[0]?.message ?? 'Invalid project id')
      }

      const parsedQuery = DocumentListQuerySchema.safeParse(request.query)
      if (!parsedQuery.success) {
        return sendBadRequest(reply, parsedQuery.error.errors[0]?.message ?? 'Invalid query')
      }

      const project = await assertProjectInTenantScope(parsedParams.data.id, tenantId)
      if (!project) {
        return sendNotFound(reply, 'Project not found in tenant scope')
      }

      const documents = await prismaDocument.findMany({
        where: {
          project_id: parsedParams.data.id,
          tenant_id: tenantId,
          ...(parsedQuery.data.type ? { type: parsedQuery.data.type } : {}),
          ...(parsedQuery.data.tag ? { tags: { has: parsedQuery.data.tag } } : {}),
        },
        orderBy: { uploaded_at: 'desc' },
        select: documentSelect,
      })

      return reply.send(documents)
    },
  )

  app.delete<{ Params: { id: string; documentId: string } }>('/projects/:id/documents/:documentId', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsedParams = DocumentDeleteParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return sendBadRequest(reply, parsedParams.error.errors[0]?.message ?? 'Invalid route params')
    }

    const project = await assertProjectInTenantScope(parsedParams.data.id, tenantId)
    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const deleted = await prismaDocument.deleteMany({
      where: {
        id: parsedParams.data.documentId,
        project_id: parsedParams.data.id,
        tenant_id: tenantId,
      },
    })

    if (deleted.count === 0) {
      return sendNotFound(reply, 'Document not found')
    }

    return reply.status(204).send()
  })
}
