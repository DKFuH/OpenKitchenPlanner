import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'

const DeletionRequestSchema = z.object({
  contact_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  performed_by: z.string().min(1).max(200),
  scope: z.array(z.enum(['contacts', 'projects', 'leads', 'documents'])).min(1),
})

const SsoProviderSchema = z.object({
  entity_id: z.string().min(1).max(500),
  sso_url: z.string().url(),
  certificate: z.string().min(10),
  enabled: z.boolean().optional(),
})

const RolePermissionSchema = z.object({
  role: z.enum(['admin', 'sales', 'planner', 'viewer']),
  resource: z.string().min(1).max(100),
  action: z.enum(['read', 'write', 'delete', 'export']),
  branch_id: z.string().uuid().nullable().optional(),
})

const CreateSlaSnapshotSchema = z.object({
  endpoint: z.string().min(1).max(200),
  p50_ms: z.number().min(0),
  p95_ms: z.number().min(0),
  uptime_pct: z.number().min(0).max(100).optional(),
  sample_size: z.number().int().min(0).optional(),
})

const prismaGdprDeletionRequest = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
}>).gdprDeletionRequest

const prismaSsoProvider = (prisma as unknown as Record<string, {
  upsert: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<unknown>
}>).ssoProvider

const prismaRolePermission = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}>).rolePermission

const prismaSlaSnapshot = (prisma as unknown as Record<string, {
  create: (args: unknown) => Promise<unknown>
  findMany: (args: unknown) => Promise<unknown>
}>).slaSnapshot

export async function complianceRoutes(app: FastifyInstance) {
  app.post('/gdpr/deletion-requests', async (request, reply) => {
    const parsed = DeletionRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantId = request.tenantId ?? ''
    const { contact_id, user_id, performed_by, scope } = parsed.data
    const result: Record<string, Record<string, number>> = { deleted: {}, anonymized: {} }

    await prisma.$transaction(async (tx) => {
      if (scope.includes('leads') && contact_id) {
        const leadDeleteResult = await tx.lead.deleteMany({ where: { contact_id, tenant_id: tenantId } })
        result.deleted.leads = leadDeleteResult.count
      }

      if (scope.includes('contacts') && contact_id) {
        const contactUpdateResult = await tx.contact.updateMany({
          where: { id: contact_id, tenant_id: tenantId },
          data: {
            first_name: '[gelöscht]',
            last_name: '[gelöscht]',
            email: null,
            phone: null,
            notes: null,
            address_json: {} as Prisma.InputJsonValue,
          },
        })
        result.anonymized.contacts = contactUpdateResult.count
      }
    })

    const deletionRequest = await prismaGdprDeletionRequest.create({
      data: {
        tenant_id: tenantId,
        contact_id: contact_id ?? null,
        user_id: user_id ?? null,
        performed_by,
        scope_json: scope as Prisma.InputJsonValue,
        result_json: result as Prisma.InputJsonValue,
        completed_at: new Date(),
      },
    })

    return reply.status(201).send(deletionRequest)
  })

  app.get('/gdpr/deletion-requests', async (request, reply) => {
    const tenantId = request.tenantId ?? ''
    const requests = await prismaGdprDeletionRequest.findMany({
      where: { tenant_id: tenantId },
      orderBy: { requested_at: 'desc' },
      take: 100,
    })
    return reply.send(requests)
  })

  app.get<{ Params: { contactId: string } }>('/gdpr/export/:contactId', async (request, reply) => {
    const tenantId = request.tenantId ?? ''
    const contact = await prisma.contact.findFirst({
      where: { id: request.params.contactId, tenant_id: tenantId },
      include: { projects: true, leads: true },
    })

    if (!contact) {
      return sendNotFound(reply, 'Contact not found')
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      contact,
      projects: contact.projects,
      leads: contact.leads,
    }

    reply.header('Content-Type', 'application/json')
    reply.header('Content-Disposition', `attachment; filename="gdpr-export-${contact.id}.json"`)
    return reply.send(exportData)
  })

  app.post('/sso-providers', async (request, reply) => {
    const parsed = SsoProviderSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantId = request.tenantId ?? ''
    const provider = await prismaSsoProvider.upsert({
      where: { tenant_id: tenantId },
      create: {
        tenant_id: tenantId,
        entity_id: parsed.data.entity_id,
        sso_url: parsed.data.sso_url,
        certificate: parsed.data.certificate,
        enabled: parsed.data.enabled ?? false,
      },
      update: {
        entity_id: parsed.data.entity_id,
        sso_url: parsed.data.sso_url,
        certificate: parsed.data.certificate,
        enabled: parsed.data.enabled,
      },
    })

    return reply.status(201).send(provider)
  })

  app.get('/sso-providers/current', async (request, reply) => {
    const tenantId = request.tenantId ?? ''
    const provider = await prismaSsoProvider.findUnique({ where: { tenant_id: tenantId } })
    if (!provider) {
      return sendNotFound(reply, 'No SSO provider configured')
    }

    return reply.send(provider)
  })

  app.post('/role-permissions', async (request, reply) => {
    const parsed = RolePermissionSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const tenantId = request.tenantId ?? ''
    const permission = await prismaRolePermission.create({
      data: {
        tenant_id: tenantId,
        role: parsed.data.role,
        resource: parsed.data.resource,
        action: parsed.data.action,
        branch_id: parsed.data.branch_id ?? null,
      },
    })

    return reply.status(201).send(permission)
  })

  app.get('/role-permissions', async (request, reply) => {
    const tenantId = request.tenantId ?? ''
    const query = request.query as { role?: string }

    const permissions = await prismaRolePermission.findMany({
      where: {
        tenant_id: tenantId,
        ...(query.role ? { role: query.role } : {}),
      },
      orderBy: [{ role: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    })

    return reply.send(permissions)
  })

  app.delete<{ Params: { id: string } }>('/role-permissions/:id', async (request, reply) => {
    const existing = await prismaRolePermission.findUnique({ where: { id: request.params.id } }) as { id: string; tenant_id: string } | null
    if (!existing || existing.tenant_id !== (request.tenantId ?? '')) {
      return sendNotFound(reply, 'Permission not found')
    }

    await prismaRolePermission.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post('/sla-snapshots', async (request, reply) => {
    const parsed = CreateSlaSnapshotSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const snapshot = await prismaSlaSnapshot.create({
      data: {
        tenant_id: request.tenantId,
        endpoint: parsed.data.endpoint,
        p50_ms: parsed.data.p50_ms,
        p95_ms: parsed.data.p95_ms,
        uptime_pct: parsed.data.uptime_pct ?? 100,
        sample_size: parsed.data.sample_size ?? 0,
      },
    })

    return reply.status(201).send(snapshot)
  })

  app.get('/sla-snapshots', async (request, reply) => {
    const query = request.query as { endpoint?: string; limit?: string }
    const limit = Number(query.limit ?? '50')

    const snapshots = await prismaSlaSnapshot.findMany({
      where: {
        ...(request.tenantId ? { tenant_id: request.tenantId } : {}),
        ...(query.endpoint ? { endpoint: query.endpoint } : {}),
      },
      orderBy: { recorded_at: 'desc' },
      take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50,
    })

    return reply.send(snapshots)
  })
}