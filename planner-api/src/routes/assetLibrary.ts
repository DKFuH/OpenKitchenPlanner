import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'
import { extractModelImportMeta } from '../services/modelImportService.js'

type AssetListEntry = {
  name: string
  collection: string | null
  tags_json: unknown
}

const LIBRARY_KIND = 'asset'
const CategorySchema = z.enum(['base', 'wall', 'appliance', 'decor', 'custom'])
const SortSchema = z.enum(['updated', 'name', 'favorites']).default('updated')

const AssetListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: CategorySchema.optional(),
  favorite_only: z.coerce.boolean().optional(),
  folder_id: z.string().uuid().optional(),
  collection: z.string().trim().min(1).max(120).optional(),
  sort: SortSchema.optional(),
})

const AssetImportBodySchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  category: CategorySchema.default('custom'),
  favorite: z.boolean().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  collection: z.string().trim().max(120).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  file_name: z.string().trim().min(1).max(240),
  file_base64: z.string().trim().min(1),
})

const AssetPatchBodySchema = z.object({
  name: z.string().trim().min(1).max(180).optional(),
  category: CategorySchema.optional(),
  favorite: z.boolean().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  collection: z.string().trim().max(120).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
  preview_url: z.string().url().nullable().optional(),
})

const FolderListQuerySchema = z.object({
  parent_id: z.string().uuid().optional(),
})

const FolderCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  parent_id: z.string().uuid().nullable().optional(),
})

const FolderPatchBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

const SavedFilterCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  saved_filter_json: z.record(z.unknown()).default({}),
})

function normalizeTags(input: string[]): string[] {
  return [...new Set(input.map((entry) => entry.trim().toLowerCase()).filter(Boolean))]
}

function ensureTenant(
  tenantId: string | null | undefined,
  reply: { status: (code: number) => { send: (payload: unknown) => unknown } },
): tenantId is string {
  if (tenantId) return true
  reply.status(403).send({ error: 'FORBIDDEN', message: 'Missing tenant scope' })
  return false
}

function stripExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index > 0 ? fileName.slice(0, index) : fileName
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

function normalizeCollection(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized.slice(0, 120) : null
}

function buildOrderBy(sort: z.infer<typeof SortSchema> | undefined): Prisma.AssetLibraryItemOrderByWithRelationInput[] {
  const effectiveSort = sort ?? 'updated'
  if (effectiveSort === 'name') {
    return [{ name: 'asc' }, { updated_at: 'desc' }]
  }
  if (effectiveSort === 'favorites') {
    return [{ favorite: 'desc' }, { updated_at: 'desc' }]
  }
  return [{ updated_at: 'desc' }]
}

async function ensureFolderInTenant(folderId: string, tenantId: string) {
  const folder = await prisma.libraryFolder.findUnique({ where: { id: folderId } })
  if (!folder || folder.tenant_id !== tenantId || folder.kind !== LIBRARY_KIND) {
    return null
  }
  return folder
}

export async function assetLibraryRoutes(app: FastifyInstance) {
  app.get('/tenant/assets', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedQuery = AssetListQuerySchema.safeParse(request.query)
    if (!parsedQuery.success) {
      return sendBadRequest(reply, parsedQuery.error.errors[0]?.message ?? 'Ungültige Filter')
    }

    const where = {
      tenant_id: tenantId,
      ...(parsedQuery.data.category ? { category: parsedQuery.data.category } : {}),
      ...(parsedQuery.data.folder_id ? { folder_id: parsedQuery.data.folder_id } : {}),
      ...(parsedQuery.data.collection ? { collection: parsedQuery.data.collection.trim() } : {}),
      ...(parsedQuery.data.favorite_only ? { favorite: true } : {}),
    }

    const items = await prisma.assetLibraryItem.findMany({
      where,
      orderBy: buildOrderBy(parsedQuery.data.sort),
    })

    const query = parsedQuery.data.q?.toLowerCase()
    if (!query) {
      return reply.send(items)
    }

    const filtered = (items as AssetListEntry[]).filter((item) => {
      const tags = Array.isArray(item.tags_json)
        ? item.tags_json.filter((entry: unknown): entry is string => typeof entry === 'string').join(' ')
        : ''
      const collection = item.collection ?? ''
      return `${item.name} ${collection} ${tags}`.toLowerCase().includes(query)
    })

    return reply.send(filtered)
  })

  app.get('/tenant/assets/folders', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedQuery = FolderListQuerySchema.safeParse(request.query)
    if (!parsedQuery.success) {
      return sendBadRequest(reply, parsedQuery.error.errors[0]?.message ?? 'Ungültiger Ordner-Filter')
    }

    const folders = await prisma.libraryFolder.findMany({
      where: {
        tenant_id: tenantId,
        kind: LIBRARY_KIND,
        ...(parsedQuery.data.parent_id ? { parent_id: parsedQuery.data.parent_id } : {}),
      },
      orderBy: [{ name: 'asc' }, { created_at: 'asc' }],
    })

    return reply.send(folders)
  })

  app.post('/tenant/assets/folders', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = FolderCreateBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Ordnerdaten')
    }

    if (parsedBody.data.parent_id) {
      const parent = await ensureFolderInTenant(parsedBody.data.parent_id, tenantId)
      if (!parent) {
        return sendBadRequest(reply, 'Übergeordneter Ordner nicht gefunden')
      }
    }

    const created = await prisma.libraryFolder.create({
      data: {
        tenant_id: tenantId,
        kind: LIBRARY_KIND,
        name: parsedBody.data.name,
        parent_id: parsedBody.data.parent_id ?? null,
      },
    })

    return reply.status(201).send(created)
  })

  app.patch<{ Params: { id: string } }>('/tenant/assets/folders/:id', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = FolderPatchBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Ordnerdaten')
    }

    const existing = await ensureFolderInTenant(request.params.id, tenantId)
    if (!existing) {
      return sendNotFound(reply, 'Ordner nicht gefunden')
    }

    if (parsedBody.data.parent_id) {
      if (parsedBody.data.parent_id === request.params.id) {
        return sendBadRequest(reply, 'Ordner kann nicht sein eigener Parent sein')
      }
      const parent = await ensureFolderInTenant(parsedBody.data.parent_id, tenantId)
      if (!parent) {
        return sendBadRequest(reply, 'Übergeordneter Ordner nicht gefunden')
      }
    }

    const updated = await prisma.libraryFolder.update({
      where: { id: request.params.id },
      data: {
        ...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'parent_id')
          ? { parent_id: parsedBody.data.parent_id ?? null }
          : {}),
      },
    })

    return reply.send(updated)
  })

  app.delete<{ Params: { id: string } }>('/tenant/assets/folders/:id', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await ensureFolderInTenant(request.params.id, tenantId)
    if (!existing) {
      return sendNotFound(reply, 'Ordner nicht gefunden')
    }

    const [childrenCount, assetsCount] = await Promise.all([
      prisma.libraryFolder.count({ where: { tenant_id: tenantId, kind: LIBRARY_KIND, parent_id: existing.id } }),
      prisma.assetLibraryItem.count({ where: { tenant_id: tenantId, folder_id: existing.id } }),
    ])

    if (childrenCount > 0 || assetsCount > 0) {
      return sendBadRequest(reply, 'Ordner ist nicht leer')
    }

    await prisma.libraryFolder.delete({ where: { id: existing.id } })
    return reply.status(204).send()
  })

  app.get('/tenant/assets/saved-filters', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const filters = await prisma.librarySavedFilter.findMany({
      where: {
        tenant_id: tenantId,
        kind: LIBRARY_KIND,
      },
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
    })

    return reply.send(filters)
  })

  app.post('/tenant/assets/saved-filters', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = SavedFilterCreateBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültiger Filter')
    }

    const created = await prisma.librarySavedFilter.create({
      data: {
        tenant_id: tenantId,
        kind: LIBRARY_KIND,
        name: parsedBody.data.name,
        saved_filter_json: parsedBody.data.saved_filter_json as Prisma.InputJsonValue,
      },
    })

    return reply.status(201).send(created)
  })

  app.delete<{ Params: { id: string } }>('/tenant/assets/saved-filters/:id', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await prisma.librarySavedFilter.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId || existing.kind !== LIBRARY_KIND) {
      return sendNotFound(reply, 'Filter nicht gefunden')
    }

    await prisma.librarySavedFilter.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post('/tenant/assets/import', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = AssetImportBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Importdaten')
    }

    let decoded: Buffer
    try {
      decoded = Buffer.from(parsedBody.data.file_base64, 'base64')
    } catch {
      return sendBadRequest(reply, 'Dateiinhalt konnte nicht gelesen werden')
    }

    if (!decoded || decoded.length === 0) {
      return sendBadRequest(reply, 'Datei ist leer')
    }

    if (decoded.length > 8 * 1024 * 1024) {
      return sendBadRequest(reply, 'Datei zu groß (max. 8 MB)')
    }

    const content = decoded.toString('utf-8')

    let importMeta
    try {
      importMeta = extractModelImportMeta(parsedBody.data.file_name, content)
    } catch (error) {
      return sendBadRequest(reply, error instanceof Error ? error.message : 'Modell konnte nicht verarbeitet werden')
    }

    const name = parsedBody.data.name ?? stripExtension(parsedBody.data.file_name)
    const safeName = slugify(name || parsedBody.data.file_name || 'asset')
    const folderId = parsedBody.data.folder_id ?? null
    if (folderId) {
      const folder = await ensureFolderInTenant(folderId, tenantId)
      if (!folder) {
        return sendBadRequest(reply, 'Ordner nicht gefunden')
      }
    }

    const created = await prisma.assetLibraryItem.create({
      data: {
        tenant_id: tenantId,
        name,
        category: parsedBody.data.category,
        favorite: parsedBody.data.favorite ?? false,
        folder_id: folderId,
        collection: normalizeCollection(parsedBody.data.collection),
        source_format: importMeta.sourceFormat,
        file_url: `asset://tenant/${tenantId}/${Date.now()}-${safeName}`,
        preview_url: null,
        bbox_json: importMeta.bboxMm as unknown as Prisma.InputJsonValue,
        default_scale_json: importMeta.defaultScale as unknown as Prisma.InputJsonValue,
        tags_json: normalizeTags(parsedBody.data.tags) as Prisma.InputJsonValue,
      },
    })

    return reply.status(201).send(created)
  })

  app.patch<{ Params: { id: string } }>('/tenant/assets/:id', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = AssetPatchBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Asset-Daten')
    }

    const existing = await prisma.assetLibraryItem.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Asset nicht gefunden')
    }

    if (parsedBody.data.folder_id) {
      const folder = await ensureFolderInTenant(parsedBody.data.folder_id, tenantId)
      if (!folder) {
        return sendBadRequest(reply, 'Ordner nicht gefunden')
      }
    }

    const updated = await prisma.assetLibraryItem.update({
      where: { id: request.params.id },
      data: {
        ...(parsedBody.data.name ? { name: parsedBody.data.name } : {}),
        ...(parsedBody.data.category ? { category: parsedBody.data.category } : {}),
        ...(parsedBody.data.favorite !== undefined ? { favorite: parsedBody.data.favorite } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'folder_id')
          ? { folder_id: parsedBody.data.folder_id ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'collection')
          ? { collection: normalizeCollection(parsedBody.data.collection) }
          : {}),
        ...(parsedBody.data.tags ? { tags_json: normalizeTags(parsedBody.data.tags) as Prisma.InputJsonValue } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'preview_url')
          ? { preview_url: parsedBody.data.preview_url }
          : {}),
      },
    })

    return reply.send(updated)
  })

  app.delete<{ Params: { id: string } }>('/tenant/assets/:id', async (request, reply) => {
    if (!ensureTenant(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await prisma.assetLibraryItem.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Asset nicht gefunden')
    }

    await prisma.assetLibraryItem.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })
}
