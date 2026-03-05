import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendConflict, sendForbidden, sendNotFound } from '../errors.js'

type TenantAwareRequest = {
  tenantId?: string | null
  headers?: Record<string, string | string[] | undefined>
}

const CreateEndpointSchema = z.object({
  name: z.string().min(1).max(160),
  provider: z.string().min(1).max(80),
  endpoint_url: z.string().url(),
  auth_mode: z.enum(['none', 'bearer', 'api_key', 'basic']).default('none'),
  auth_config: z.record(z.unknown()).optional(),
  mapping_profile_json: z.record(z.unknown()).optional(),
  dry_run: z.boolean().optional(),
  is_active: z.boolean().optional(),
  mapping_profile: z.object({
    name: z.string().min(1).max(120),
    config_json: z.record(z.unknown()).default({}),
    is_active: z.boolean().default(true),
  }).optional(),
})

const EndpointIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const OutboxIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const InboundProviderParamsSchema = z.object({
  provider: z.string().min(1).max(80),
})

const InboundPayloadSchema = z.object({
  event_type: z.string().min(1).max(120).default('event'),
  payload_json: z.record(z.unknown()).default({}),
  external_ref: z.string().max(200).optional(),
  status: z.string().max(80).optional(),
  idempotency_key: z.string().min(1).max(190).optional(),
})

const OutboxQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'delivered', 'failed', 'dead_letter']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

function headerValue(value: string | string[] | undefined): string | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function getTenantId(request: TenantAwareRequest): string | null {
  return request.tenantId ?? headerValue(request.headers?.['x-tenant-id'])
}

export async function integrationHooksRoutes(app: FastifyInstance) {
  app.post('/integrations/endpoints', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const parsed = CreateEndpointSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const created = await prisma.$transaction(async (tx) => {
      const endpoint = await tx.integrationEndpoint.create({
        data: {
          tenant_id: tenantId,
          name: parsed.data.name,
          provider: parsed.data.provider,
          endpoint_url: parsed.data.endpoint_url,
          auth_mode: parsed.data.auth_mode,
          auth_config: (parsed.data.auth_config ?? {}) as Prisma.InputJsonValue,
          mapping_profile_json: (parsed.data.mapping_profile_json ?? {}) as Prisma.InputJsonValue,
          dry_run: parsed.data.dry_run ?? false,
          is_active: parsed.data.is_active ?? true,
        },
      })

      if (parsed.data.mapping_profile) {
        await tx.integrationMappingProfile.create({
          data: {
            tenant_id: tenantId,
            endpoint_id: endpoint.id,
            name: parsed.data.mapping_profile.name,
            config_json: parsed.data.mapping_profile.config_json as Prisma.InputJsonValue,
            is_active: parsed.data.mapping_profile.is_active,
          },
        })
      }

      return endpoint
    })

    return reply.status(201).send(created)
  })

  app.get('/integrations/endpoints', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const endpoints = await prisma.integrationEndpoint.findMany({
      where: {
        tenant_id: tenantId,
      },
      include: {
        mapping_profiles: {
          where: { is_active: true },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return reply.send(endpoints)
  })

  app.post<{ Params: { id: string } }>('/integrations/endpoints/:id/test', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = EndpointIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid endpoint id')
    }

    const endpoint = await prisma.integrationEndpoint.findFirst({
      where: {
        id: params.data.id,
        tenant_id: tenantId,
      },
    })

    if (!endpoint) {
      return sendNotFound(reply, 'Integration endpoint not found in tenant scope')
    }

    const outbox = await prisma.$transaction(async (tx) => {
      const created = await tx.integrationOutboxMessage.create({
        data: {
          tenant_id: tenantId,
          endpoint_id: endpoint.id,
          event_type: 'integration_test',
          payload_json: {
            ping: true,
            endpoint_id: endpoint.id,
            created_at: new Date().toISOString(),
          } as Prisma.InputJsonValue,
          idempotency_key: `${endpoint.id}:test:${randomUUID()}`,
          status: endpoint.dry_run ? 'delivered' : 'pending',
          attempt_count: 1,
          delivered_at: endpoint.dry_run ? new Date() : null,
        },
      })

      await tx.integrationDeliveryAttempt.create({
        data: {
          tenant_id: tenantId,
          outbox_message_id: created.id,
          attempt_no: 1,
          http_status: endpoint.dry_run ? 200 : 202,
          response_json: endpoint.dry_run
            ? { dry_run: true, ok: true }
            : { queued: true, ok: true },
        },
      })

      return created
    })

    return reply.send({
      ok: true,
      endpoint_id: endpoint.id,
      outbox_id: outbox.id,
      mode: endpoint.dry_run ? 'dry_run' : 'queued',
    })
  })

  app.get('/integrations/outbox', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const query = OutboxQuerySchema.safeParse(request.query)
    if (!query.success) {
      return sendBadRequest(reply, query.error.errors[0]?.message ?? 'Invalid query')
    }

    const outbox = await prisma.integrationOutboxMessage.findMany({
      where: {
        tenant_id: tenantId,
        ...(query.data.status ? { status: query.data.status } : {}),
      },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            provider: true,
            dry_run: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: query.data.limit,
    })

    return reply.send(outbox)
  })

  app.post<{ Params: { id: string } }>('/integrations/outbox/:id/replay', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = OutboxIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid outbox id')
    }

    const existing = await prisma.integrationOutboxMessage.findFirst({
      where: {
        id: params.data.id,
        tenant_id: tenantId,
      },
      include: {
        endpoint: {
          select: {
            dry_run: true,
          },
        },
      },
    })

    if (!existing) {
      return sendNotFound(reply, 'Outbox message not found in tenant scope')
    }

    const nextAttempt = existing.attempt_count + 1

    const updated = await prisma.$transaction(async (tx) => {
      await tx.integrationDeliveryAttempt.create({
        data: {
          tenant_id: tenantId,
          outbox_message_id: existing.id,
          attempt_no: nextAttempt,
          http_status: existing.endpoint.dry_run ? 200 : 202,
          response_json: existing.endpoint.dry_run
            ? { replayed: true, dry_run: true }
            : { replayed: true, queued: true },
        },
      })

      return tx.integrationOutboxMessage.update({
        where: { id: existing.id },
        data: {
          attempt_count: nextAttempt,
          status: existing.endpoint.dry_run ? 'delivered' : 'pending',
          next_retry_at: null,
          last_error: null,
          delivered_at: existing.endpoint.dry_run ? new Date() : existing.delivered_at,
        },
      })
    })

    return reply.send(updated)
  })

  app.post<{ Params: { provider: string } }>('/integrations/inbound/:provider', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = InboundProviderParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid provider')
    }

    const payload = InboundPayloadSchema.safeParse(request.body)
    if (!payload.success) {
      return sendBadRequest(reply, payload.error.errors[0]?.message ?? 'Invalid payload')
    }

    const endpoints = await prisma.integrationEndpoint.findMany({
      where: {
        tenant_id: tenantId,
        provider: params.data.provider,
        is_active: true,
      },
      select: {
        id: true,
        dry_run: true,
      },
    })

    if (endpoints.length === 0) {
      return sendNotFound(reply, 'No active integration endpoint for provider in tenant scope')
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const createdIds: string[] = []

        for (const endpoint of endpoints) {
          const baseIdempotency = payload.data.idempotency_key ?? randomUUID()
          const outbox = await tx.integrationOutboxMessage.create({
            data: {
              tenant_id: tenantId,
              endpoint_id: endpoint.id,
              event_type: `inbound:${params.data.provider}:${payload.data.event_type}`,
              payload_json: {
                ...payload.data.payload_json,
                external_ref: payload.data.external_ref ?? null,
                status: payload.data.status ?? null,
              } as Prisma.InputJsonValue,
              idempotency_key: `${endpoint.id}:${baseIdempotency}`,
              status: endpoint.dry_run ? 'delivered' : 'pending',
              attempt_count: 1,
              delivered_at: endpoint.dry_run ? new Date() : null,
            },
          })

          await tx.integrationDeliveryAttempt.create({
            data: {
              tenant_id: tenantId,
              outbox_message_id: outbox.id,
              attempt_no: 1,
              http_status: endpoint.dry_run ? 200 : 202,
              response_json: endpoint.dry_run
                ? { inbound: true, dry_run: true }
                : { inbound: true, queued: true },
            },
          })

          createdIds.push(outbox.id)
        }

        return createdIds
      })

      return reply.status(202).send({
        received: true,
        provider: params.data.provider,
        endpoint_count: endpoints.length,
        outbox_ids: created,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2002'
      ) {
        return sendConflict(reply, 'Duplicate idempotency key for inbound payload')
      }
      throw error
    }
  })

  app.get<{ Params: { id: string } }>('/integrations/deliveries/:id', async (request, reply) => {
    const tenantId = getTenantId(request)
    if (!tenantId) {
      return sendForbidden(reply, 'Tenant scope is required')
    }

    const params = OutboxIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendBadRequest(reply, params.error.errors[0]?.message ?? 'Invalid delivery id')
    }

    const delivery = await prisma.integrationOutboxMessage.findFirst({
      where: {
        id: params.data.id,
        tenant_id: tenantId,
      },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            provider: true,
            endpoint_url: true,
            dry_run: true,
          },
        },
        attempts: {
          orderBy: { attempt_no: 'desc' },
        },
      },
    })

    if (!delivery) {
      return sendNotFound(reply, 'Delivery not found in tenant scope')
    }

    return reply.send(delivery)
  })
}
