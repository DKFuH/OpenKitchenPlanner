import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import { prisma } from '../db.js'

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

const CreateCatalogIndexSchema = z.object({
  catalog_id: z.string().min(1).max(255),
  purchase_index: z.number().positive().max(10),
  sales_index: z.number().positive().max(10),
  applied_by: z.string().min(1).max(255),
})

type TenantAwareRequest = {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}

function getTenantId(request: TenantAwareRequest): string | null {
  if (request.tenantId) {
    return request.tenantId
  }

  const tenantHeader = request.headers?.['x-tenant-id']
  if (!tenantHeader) {
    return null
  }

  return Array.isArray(tenantHeader) ? (tenantHeader[0] ?? null) : tenantHeader
}

const prismaCatalogIndex = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
}>).catalogIndex

export async function catalogIndexRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/projects/:id/catalog-indices', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = ParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid project id')
    }

    const parsedBody = CreateCatalogIndexSchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Invalid payload')
    }

    const project = await prisma.project.findFirst({
      where: { id: params.data.id, tenant_id: tenantId },
      select: { id: true },
    })

    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const record = await prismaCatalogIndex.create({
      data: {
        project_id: params.data.id,
        catalog_id: parsedBody.data.catalog_id,
        purchase_index: parsedBody.data.purchase_index,
        sales_index: parsedBody.data.sales_index,
        applied_by: parsedBody.data.applied_by,
      },
      select: {
        id: true,
        project_id: true,
        catalog_id: true,
        purchase_index: true,
        sales_index: true,
        applied_at: true,
        applied_by: true,
      },
    })

    return reply.status(201).send(record)
  })

  app.get<{ Params: { id: string } }>('/projects/:id/catalog-indices', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = ParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid project id')
    }

    const project = await prisma.project.findFirst({
      where: { id: params.data.id, tenant_id: tenantId },
      select: { id: true },
    })

    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const records = await prismaCatalogIndex.findMany({
      where: { project_id: params.data.id },
      orderBy: { applied_at: 'desc' },
      select: {
        id: true,
        project_id: true,
        catalog_id: true,
        purchase_index: true,
        sales_index: true,
        applied_at: true,
        applied_by: true,
      },
    })

    return reply.send(records)
  })
}
