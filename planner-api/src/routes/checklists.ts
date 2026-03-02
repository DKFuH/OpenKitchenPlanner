import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'

const ChecklistItemSchema = z.object({
  position: z.number().int().min(0),
  label: z.string().min(1).max(500),
  checked: z.boolean().optional(),
  photo_url: z.string().url().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
})

const CreateChecklistSchema = z.object({
  project_id: z.string().uuid(),
  production_order_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  created_by: z.string().min(1).max(200),
  items: z.array(ChecklistItemSchema).optional(),
})

const UpdateItemSchema = z.object({
  checked: z.boolean().optional(),
  photo_url: z.string().url().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
})

export async function checklistRoutes(app: FastifyInstance) {
  app.post('/checklists', async (request, reply) => {
    const parsed = CreateChecklistSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const project = await prisma.project.findUnique({ where: { id: parsed.data.project_id } })
    if (!project) {
      return sendNotFound(reply, 'Project not found')
    }

    const tenantId = project.tenant_id ?? request.tenantId ?? ''
    const checklist = await prisma.installationChecklist.create({
      data: {
        project_id: parsed.data.project_id,
        tenant_id: tenantId,
        production_order_id: parsed.data.production_order_id ?? null,
        title: parsed.data.title ?? 'Abnahmeprotokoll',
        created_by: parsed.data.created_by,
        items: parsed.data.items
          ? {
              create: parsed.data.items.map((item) => ({
                position: item.position,
                label: item.label,
                checked: item.checked ?? false,
                photo_url: item.photo_url ?? null,
                note: item.note ?? null,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { position: 'asc' } } },
    })

    return reply.status(201).send(checklist)
  })

  app.get<{ Params: { id: string } }>('/projects/:id/checklists', async (request, reply) => {
    const project = await prisma.project.findUnique({ where: { id: request.params.id } })
    if (!project) {
      return sendNotFound(reply, 'Project not found')
    }

    const checklists = await prisma.installationChecklist.findMany({
      where: { project_id: request.params.id },
      include: { items: { orderBy: { position: 'asc' } } },
      orderBy: { created_at: 'desc' },
    })

    return reply.send(checklists)
  })

  app.get<{ Params: { id: string } }>('/checklists/:id', async (request, reply) => {
    const checklist = await prisma.installationChecklist.findUnique({
      where: { id: request.params.id },
      include: { items: { orderBy: { position: 'asc' } } },
    })

    if (!checklist) {
      return sendNotFound(reply, 'Checklist not found')
    }

    return reply.send(checklist)
  })

  app.patch<{ Params: { checklistId: string; itemId: string } }>(
    '/checklists/:checklistId/items/:itemId',
    async (request, reply) => {
      const parsed = UpdateItemSchema.safeParse(request.body)
      if (!parsed.success) {
        return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
      }

      const checklist = await prisma.installationChecklist.findUnique({ where: { id: request.params.checklistId } })
      if (!checklist) {
        return sendNotFound(reply, 'Checklist not found')
      }

      const item = await prisma.checklistItem.findUnique({ where: { id: request.params.itemId } })
      if (!item || item.checklist_id !== request.params.checklistId) {
        return sendNotFound(reply, 'Item not found')
      }

      const updated = await prisma.checklistItem.update({
        where: { id: request.params.itemId },
        data: {
          ...(parsed.data.checked !== undefined && { checked: parsed.data.checked }),
          ...(parsed.data.photo_url !== undefined && { photo_url: parsed.data.photo_url }),
          ...(parsed.data.note !== undefined && { note: parsed.data.note }),
        },
      })

      const allItems = await prisma.checklistItem.findMany({ where: { checklist_id: request.params.checklistId } })
      if (allItems.every((currentItem) => (currentItem.id === updated.id ? updated.checked : currentItem.checked))) {
        await prisma.installationChecklist.update({
          where: { id: request.params.checklistId },
          data: { completed_at: new Date() },
        })
      }

      return reply.send(updated)
    },
  )

  app.delete<{ Params: { id: string } }>('/checklists/:id', async (request, reply) => {
    const existing = await prisma.installationChecklist.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return sendNotFound(reply, 'Checklist not found')
    }

    await prisma.installationChecklist.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })
}
