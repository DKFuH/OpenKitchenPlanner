import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  applyDrawingGroupConfigSync,
  applyDrawingGroupTransform,
  type DrawingGroupConfig,
} from '../services/groupTransformService.js'

const GroupKindSchema = z.enum(['selection_set', 'drawing_group', 'component', 'annotation_group'])
const GroupMemberTypeSchema = z.enum(['placement', 'opening', 'dimension', 'centerline'])

const GroupMemberSchema = z.object({
  entity_type: GroupMemberTypeSchema,
  entity_id: z.string().min(1),
  room_id: z.string().uuid().optional(),
})

const CreateDrawingGroupSchema = z.object({
  name: z.string().trim().min(1).max(140),
  kind: GroupKindSchema,
  members_json: z.array(GroupMemberSchema).min(1).max(500),
  config_json: z.record(z.unknown()).optional(),
})

const UpdateDrawingGroupSchema = z.object({
  name: z.string().trim().min(1).max(140).optional(),
  kind: GroupKindSchema.optional(),
  members_json: z.array(GroupMemberSchema).min(1).max(500).optional(),
  config_json: z.record(z.unknown()).optional(),
  sync_members: z.boolean().optional(),
}).refine(
  (value) => (
    value.name !== undefined ||
    value.kind !== undefined ||
    value.members_json !== undefined ||
    value.config_json !== undefined ||
    value.sync_members !== undefined
  ),
  {
    message: 'At least one field must be provided',
  },
)

const ApplyTransformSchema = z.object({
  translate: z.object({
    x_mm: z.number(),
    y_mm: z.number(),
  }).optional(),
  rotation_deg: z.number().min(-360).max(360).optional(),
  pivot: z.object({
    x_mm: z.number(),
    y_mm: z.number(),
  }).optional(),
})

type DrawingGroupRecord = {
  id: string
  tenant_id: string
  project_id: string
  name: string
  kind: string
  members_json: unknown
  config_json: unknown
  created_at: Date
  updated_at: Date
}

type DrawingGroupDelegate = {
  findMany: (args: unknown) => Promise<DrawingGroupRecord[]>
  findUnique: (args: unknown) => Promise<DrawingGroupRecord | null>
  create: (args: unknown) => Promise<DrawingGroupRecord>
  update: (args: unknown) => Promise<DrawingGroupRecord>
  delete: (args: unknown) => Promise<unknown>
}

function getDrawingGroupDelegate(): DrawingGroupDelegate {
  return (prisma as unknown as { drawingGroup: DrawingGroupDelegate }).drawingGroup
}

function resolveTenantId(request: {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}) {
  if (request.tenantId) {
    return request.tenantId
  }

  const tenantHeader = request.headers?.['x-tenant-id']
  if (!tenantHeader) {
    return null
  }

  return Array.isArray(tenantHeader) ? (tenantHeader[0] ?? null) : tenantHeader
}

async function resolveProjectInTenant(projectId: string, tenantId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, tenant_id: true },
  })

  if (!project) {
    return null
  }

  if (project.tenant_id && project.tenant_id !== tenantId) {
    return null
  }

  return project
}

export async function drawingGroupsRoutes(app: FastifyInstance) {
  const drawingGroups = getDrawingGroupDelegate()

  app.get<{ Params: { id: string } }>('/projects/:id/drawing-groups', async (request, reply) => {
    const tenantId = resolveTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const project = await resolveProjectInTenant(request.params.id, tenantId)
    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const items = await drawingGroups.findMany({
      where: {
        tenant_id: tenantId,
        project_id: project.id,
      },
      orderBy: [{ kind: 'asc' }, { updated_at: 'desc' }],
    })

    return reply.send(items)
  })

  app.post<{ Params: { id: string } }>('/projects/:id/drawing-groups', async (request, reply) => {
    const tenantId = resolveTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const project = await resolveProjectInTenant(request.params.id, tenantId)
    if (!project) {
      return sendNotFound(reply, 'Project not found in tenant scope')
    }

    const parsed = CreateDrawingGroupSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const created = await drawingGroups.create({
      data: {
        tenant_id: tenantId,
        project_id: project.id,
        name: parsed.data.name,
        kind: parsed.data.kind,
        members_json: parsed.data.members_json,
        config_json: parsed.data.config_json ?? {},
      },
    })

    return reply.status(201).send(created)
  })

  app.patch<{ Params: { id: string } }>('/drawing-groups/:id', async (request, reply) => {
    const tenantId = resolveTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsed = UpdateDrawingGroupSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const existing = await drawingGroups.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Drawing group not found')
    }

    const updated = await drawingGroups.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.kind !== undefined ? { kind: parsed.data.kind } : {}),
        ...(parsed.data.members_json !== undefined ? { members_json: parsed.data.members_json } : {}),
        ...(parsed.data.config_json !== undefined ? { config_json: parsed.data.config_json } : {}),
      },
    })

    if (!parsed.data.sync_members) {
      return reply.send(updated)
    }

    const syncConfig = (parsed.data.config_json ?? updated.config_json) as DrawingGroupConfig
    const memberSync = await applyDrawingGroupConfigSync({
      prisma: prisma as unknown as Parameters<typeof applyDrawingGroupConfigSync>[0]['prisma'],
      group: {
        id: updated.id,
        project_id: updated.project_id,
        members_json: updated.members_json,
        config_json: updated.config_json,
      },
      config: syncConfig,
    })

    return reply.send({
      ...updated,
      member_sync: memberSync,
    })
  })

  app.delete<{ Params: { id: string } }>('/drawing-groups/:id', async (request, reply) => {
    const tenantId = resolveTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const existing = await drawingGroups.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Drawing group not found')
    }

    await drawingGroups.delete({ where: { id: existing.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/drawing-groups/:id/apply-transform', async (request, reply) => {
    const tenantId = resolveTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsed = ApplyTransformSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const existing = await drawingGroups.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Drawing group not found')
    }

    const transformed = await applyDrawingGroupTransform({
      prisma: prisma as unknown as Parameters<typeof applyDrawingGroupTransform>[0]['prisma'],
      group: {
        id: existing.id,
        project_id: existing.project_id,
        members_json: existing.members_json,
        config_json: existing.config_json,
      },
      transform: parsed.data,
    })

    if (transformed.blocked) {
      return sendBadRequest(reply, transformed.skipped_reasons[0] ?? 'Group is locked')
    }

    return reply.send(transformed)
  })
}
