import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'
import { pushToErp } from '../services/erpPushService.js'

const CreateConnectorSchema = z.object({
  name: z.string().min(1).max(200),
  endpoint: z.string().url(),
  auth_config: z.record(z.unknown()).optional(),
  field_mapping: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
})

const UpdateConnectorSchema = CreateConnectorSchema.partial()

const PushToErpSchema = z.object({ connector_id: z.string().uuid() })

const WebhookSchema = z.object({
  erp_order_ref: z.string().min(1),
  status: z.string().min(1),
})

const ERP_TO_PO_STATUS = {
  confirmed: 'confirmed',
  shipped: 'partially_delivered',
  delivered: 'delivered',
  cancelled: 'cancelled',
} as const

export async function erpConnectorRoutes(app: FastifyInstance) {
  app.post('/erp-connectors', async (request, reply) => {
    const parsed = CreateConnectorSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const connector = await prisma.erpConnector.create({
      data: {
        tenant_id: request.tenantId ?? '',
        name: parsed.data.name,
        endpoint: parsed.data.endpoint,
        auth_config: (parsed.data.auth_config ?? {}) as Prisma.InputJsonValue,
        field_mapping: (parsed.data.field_mapping ?? {}) as Prisma.InputJsonValue,
        enabled: parsed.data.enabled ?? true,
      },
    })

    return reply.status(201).send(connector)
  })

  app.get('/erp-connectors', async (request, reply) => {
    const connectors = await prisma.erpConnector.findMany({
      where: { tenant_id: request.tenantId ?? '' },
      orderBy: { name: 'asc' },
    })

    return reply.send(connectors)
  })

  app.get<{ Params: { id: string } }>('/erp-connectors/:id', async (request, reply) => {
    const connector = await prisma.erpConnector.findUnique({ where: { id: request.params.id } })
    if (!connector) {
      return sendNotFound(reply, 'ERP connector not found')
    }

    return reply.send(connector)
  })

  app.put<{ Params: { id: string } }>('/erp-connectors/:id', async (request, reply) => {
    const parsed = UpdateConnectorSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const existing = await prisma.erpConnector.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return sendNotFound(reply, 'ERP connector not found')
    }

    const connector = await prisma.erpConnector.update({
      where: { id: request.params.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.endpoint !== undefined ? { endpoint: parsed.data.endpoint } : {}),
        ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
        ...(parsed.data.auth_config !== undefined
          ? { auth_config: parsed.data.auth_config as Prisma.InputJsonValue }
          : {}),
        ...(parsed.data.field_mapping !== undefined
          ? { field_mapping: parsed.data.field_mapping as Prisma.InputJsonValue }
          : {}),
      },
    })

    return reply.send(connector)
  })

  app.delete<{ Params: { id: string } }>('/erp-connectors/:id', async (request, reply) => {
    const existing = await prisma.erpConnector.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return sendNotFound(reply, 'ERP connector not found')
    }

    await prisma.erpConnector.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/purchase-orders/:id/push-to-erp', async (request, reply) => {
    const parsed = PushToErpSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, 'connector_id required')
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: request.params.id },
      include: { items: true },
    })
    if (!purchaseOrder) {
      return sendNotFound(reply, 'Purchase order not found')
    }

    const connector = await prisma.erpConnector.findUnique({ where: { id: parsed.data.connector_id } })
    if (!connector) {
      return sendNotFound(reply, 'ERP connector not found')
    }
    if (!connector.enabled) {
      return sendBadRequest(reply, 'ERP connector is disabled')
    }

    const result = await pushToErp(
      connector as Parameters<typeof pushToErp>[0],
      {
        id: purchaseOrder.id,
        supplier_name: purchaseOrder.supplier_name,
        supplier_ref: purchaseOrder.supplier_ref,
        items: purchaseOrder.items,
      },
    )

    if (result.success && result.erp_order_ref) {
      await prisma.purchaseOrder.update({
        where: { id: request.params.id },
        data: { erp_order_ref: result.erp_order_ref, erp_connector_id: connector.id },
      })
    }

    return reply.send(result)
  })

  app.post<{ Params: { connectorId: string } }>('/erp-webhook/:connectorId', async (request, reply) => {
    const parsed = WebhookSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, 'erp_order_ref and status required')
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        erp_order_ref: parsed.data.erp_order_ref,
        erp_connector_id: request.params.connectorId,
      },
    })

    if (!order) {
      return reply.status(200).send({ received: true })
    }

    const nextStatus = ERP_TO_PO_STATUS[parsed.data.status.toLowerCase() as keyof typeof ERP_TO_PO_STATUS]
    if (nextStatus) {
      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextStatus as Parameters<typeof prisma.purchaseOrder.update>[0]['data']['status'],
        },
      })
    }

    return reply.status(200).send({ received: true })
  })
}
