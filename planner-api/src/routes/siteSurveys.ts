import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'

const MeasurementSchema = z.object({
  rooms: z.array(z.object({
    name: z.string().min(1).max(100),
    width_mm: z.number().positive(),
    depth_mm: z.number().positive(),
    height_mm: z.number().positive().optional(),
  })).optional(),
})

const PhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(500).optional(),
  room_id: z.string().optional(),
  taken_at: z.string().datetime().optional(),
})

const CreateSurveySchema = z.object({
  measurements: MeasurementSchema.optional(),
  photos: z.array(PhotoSchema).optional(),
  notes: z.string().max(2000).nullable().optional(),
  created_by: z.string().min(1).max(200),
})

const UpdateSurveySchema = z.object({
  measurements: MeasurementSchema.optional(),
  photos: z.array(PhotoSchema).optional(),
  notes: z.string().max(2000).nullable().optional(),
  synced_at: z.string().datetime().optional(),
})

export async function siteSurveyRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/projects/:id/site-surveys', async (request, reply) => {
    const parsed = CreateSurveySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const project = await prisma.project.findUnique({ where: { id: request.params.id } })
    if (!project) {
      return sendNotFound(reply, 'Project not found')
    }

    const tenantId = project.tenant_id ?? request.tenantId ?? ''
    const survey = await prisma.siteSurvey.create({
      data: {
        project_id: request.params.id,
        tenant_id: tenantId,
        measurements: parsed.data.measurements ?? {},
        photos: parsed.data.photos ?? [],
        notes: parsed.data.notes ?? null,
        created_by: parsed.data.created_by,
      },
    })

    return reply.status(201).send(survey)
  })

  app.get<{ Params: { id: string } }>('/projects/:id/site-surveys', async (request, reply) => {
    const project = await prisma.project.findUnique({ where: { id: request.params.id } })
    if (!project) {
      return sendNotFound(reply, 'Project not found')
    }

    const surveys = await prisma.siteSurvey.findMany({
      where: { project_id: request.params.id },
      orderBy: { created_at: 'desc' },
    })

    return reply.send(surveys)
  })

  app.get<{ Params: { id: string } }>('/site-surveys/:id', async (request, reply) => {
    const survey = await prisma.siteSurvey.findUnique({ where: { id: request.params.id } })
    if (!survey) {
      return sendNotFound(reply, 'Survey not found')
    }

    return reply.send(survey)
  })

  app.put<{ Params: { id: string } }>('/site-surveys/:id', async (request, reply) => {
    const parsed = UpdateSurveySchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid payload')
    }

    const existing = await prisma.siteSurvey.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return sendNotFound(reply, 'Survey not found')
    }

    const survey = await prisma.siteSurvey.update({
      where: { id: request.params.id },
      data: {
        ...(parsed.data.measurements !== undefined && { measurements: parsed.data.measurements }),
        ...(parsed.data.photos !== undefined && { photos: parsed.data.photos }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        ...(parsed.data.synced_at !== undefined && { synced_at: new Date(parsed.data.synced_at) }),
      },
    })

    return reply.send(survey)
  })

  app.delete<{ Params: { id: string } }>('/site-surveys/:id', async (request, reply) => {
    const existing = await prisma.siteSurvey.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return sendNotFound(reply, 'Survey not found')
    }

    await prisma.siteSurvey.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })
}
