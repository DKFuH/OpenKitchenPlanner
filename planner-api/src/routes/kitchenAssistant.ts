import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'
import { suggestLayouts, type RoomGeometry } from '../services/kitchenAssistant.js'

const MacroBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  positions: z.array(z.object({
    wall_id: z.string().nullable(),
    offset_mm: z.number(),
    article_id: z.string(),
    width_mm: z.number().positive(),
    depth_mm: z.number().positive(),
    height_mm: z.number().positive(),
  })).min(1),
  created_by: z.string(),
})

const FavoriteBodySchema = z.object({
  is_favorite: z.boolean(),
})

const CatalogHierarchyQuerySchema = z.object({
  collection: z.string().optional(),
  family: z.string().optional(),
  style_tag: z.string().optional(),
  search: z.string().optional(),
  only_favorites: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

type RoomBoundary = {
  wall_segments?: Array<{ id: string; x0_mm: number; y0_mm: number; x1_mm: number; y1_mm: number; has_opening?: boolean }>
} | null

export async function kitchenAssistantRoutes(app: FastifyInstance) {
  const db = prisma as any

  app.get('/catalog/hierarchy', async (request, reply) => {
    const baseWhere = request.tenantId ? { tenant_id: request.tenantId } : {}

    const [collections, families, styleTags] = await Promise.all([
      db.catalogArticle.findMany({
        where: { ...baseWhere, collection: { not: null } },
        select: { collection: true },
        distinct: ['collection'],
        orderBy: { collection: 'asc' },
      }),
      db.catalogArticle.findMany({
        where: { ...baseWhere, family: { not: null } },
        select: { family: true },
        distinct: ['family'],
        orderBy: { family: 'asc' },
      }),
      db.catalogArticle.findMany({
        where: { ...baseWhere, style_tag: { not: null } },
        select: { style_tag: true },
        distinct: ['style_tag'],
        orderBy: { style_tag: 'asc' },
      }),
    ])

    return reply.send({
      collections: collections.map((row: { collection: string | null }) => row.collection).filter(Boolean),
      families: families.map((row: { family: string | null }) => row.family).filter(Boolean),
      style_tags: styleTags.map((row: { style_tag: string | null }) => row.style_tag).filter(Boolean),
    })
  })

  app.get<{ Querystring: z.infer<typeof CatalogHierarchyQuerySchema> }>(
    '/catalog/articles',
    async (request, reply) => {
      const parsed = CatalogHierarchyQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid query')
      }

      const { collection, family, style_tag, search, only_favorites, limit, offset } = parsed.data
      const where: Record<string, unknown> = {}

      if (request.tenantId) where.tenant_id = request.tenantId
      if (collection) where.collection = collection
      if (family) where.family = family
      if (style_tag) where.style_tag = style_tag
      if (only_favorites) where.is_favorite = true
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [articles, total] = await Promise.all([
        db.catalogArticle.findMany({ where, take: limit, skip: offset, orderBy: { name: 'asc' } }),
        db.catalogArticle.count({ where }),
      ])

      return reply.send({ total, articles })
    },
  )

  app.patch<{ Params: { id: string }; Body: z.infer<typeof FavoriteBodySchema> }>(
    '/catalog/articles/:id/favorite',
    async (request, reply) => {
      const parsedBody = FavoriteBodySchema.safeParse(request.body)
      if (!parsedBody.success) {
        return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Invalid body')
      }

      const article = await db.catalogArticle.findUnique({ where: { id: request.params.id } })
      if (!article) return sendNotFound(reply, 'Article not found')

      const updated = await db.catalogArticle.update({
        where: { id: request.params.id },
        data: { is_favorite: parsedBody.data.is_favorite },
      })

      return reply.send(updated)
    },
  )

  app.post<{ Body: z.infer<typeof MacroBodySchema> }>(
    '/catalog-macros',
    async (request, reply) => {
      const parsed = MacroBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return sendBadRequest(reply, parsed.error.errors[0]?.message ?? 'Invalid body')
      }

      const macro = await db.catalogMacro.create({
        data: {
          tenant_id: request.tenantId ?? 'default',
          ...parsed.data,
        },
      })

      return reply.status(201).send(macro)
    },
  )

  app.get('/catalog-macros', async (request, reply) => {
    const where = request.tenantId ? { tenant_id: request.tenantId } : {}
    const macros = await db.catalogMacro.findMany({ where, orderBy: { name: 'asc' } })
    return reply.send(macros)
  })

  app.get<{ Params: { id: string } }>('/catalog-macros/:id', async (request, reply) => {
    const macro = await db.catalogMacro.findUnique({ where: { id: request.params.id } })
    if (!macro) return sendNotFound(reply, 'Macro not found')
    return reply.send(macro)
  })

  app.delete<{ Params: { id: string } }>('/catalog-macros/:id', async (request, reply) => {
    const macro = await db.catalogMacro.findUnique({ where: { id: request.params.id } })
    if (!macro) return sendNotFound(reply, 'Macro not found')

    await db.catalogMacro.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/rooms/:id/suggest-layout', async (request, reply) => {
    const room = await db.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const boundary = room.boundary as RoomBoundary
    if (!boundary?.wall_segments || boundary.wall_segments.length === 0) {
      return sendBadRequest(reply, 'Room has no wall segments – cannot suggest layout')
    }

    const geometry: RoomGeometry = {
      wall_segments: boundary.wall_segments,
      ceiling_height_mm: room.ceiling_height_mm,
    }

    const suggestions = suggestLayouts(geometry)
    if (suggestions.length === 0) {
      return reply.send({ suggestions: [], message: 'Kein Layout-Vorschlag möglich für diese Raumgeometrie' })
    }

    const saved = await Promise.all(
      suggestions.map((suggestion) => db.kitchenLayoutSuggestion.create({
        data: {
          project_id: room.project_id,
          room_id: room.id,
          layout_type: suggestion.layout_type,
          positions: suggestion.positions,
          score: suggestion.score,
        },
      })),
    )

    return reply.status(201).send({ suggestions: saved.map((entry: any, index: number) => ({ ...entry, reason: suggestions[index].reason })) })
  })

  app.post<{ Params: { id: string } }>('/kitchen-layout-suggestions/:id/apply', async (request, reply) => {
    const suggestion = await db.kitchenLayoutSuggestion.findUnique({ where: { id: request.params.id } })
    if (!suggestion) return sendNotFound(reply, 'Suggestion not found')

    if (suggestion.applied) {
      return sendBadRequest(reply, 'Suggestion already applied')
    }

    const room = await db.room.findUnique({ where: { id: suggestion.room_id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const existing = Array.isArray(room.placements) ? room.placements : []
    const suggestionPositions = Array.isArray(suggestion.positions) ? suggestion.positions : []

    await db.room.update({
      where: { id: room.id },
      data: { placements: [...existing, ...suggestionPositions] },
    })

    await db.kitchenLayoutSuggestion.update({
      where: { id: suggestion.id },
      data: { applied: true },
    })

    return reply.send({ applied: true, placements_added: suggestionPositions.length })
  })

  app.get<{ Params: { id: string } }>('/rooms/:id/layout-suggestions', async (request, reply) => {
    const room = await db.room.findUnique({ where: { id: request.params.id } })
    if (!room) return sendNotFound(reply, 'Room not found')

    const suggestions = await db.kitchenLayoutSuggestion.findMany({
      where: { room_id: request.params.id },
      orderBy: { score: 'desc' },
    })

    return reply.send(suggestions)
  })
}
