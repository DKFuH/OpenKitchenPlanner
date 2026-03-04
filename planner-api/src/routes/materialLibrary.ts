import type { FastifyInstance, FastifyReply } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'
import { resolveMaterialAssignment, type MaterialCategory } from '../services/materialResolver.js'

const LIBRARY_KIND = 'material'
const MaterialCategorySchema = z.enum(['floor', 'wall', 'front', 'worktop', 'custom'])
const SurfaceTargetSchema = z.enum(['floor', 'ceiling', 'wall_north', 'wall_south', 'wall_east', 'wall_west'])
const SortSchema = z.enum(['updated', 'name', 'favorites']).default('updated')

const MaterialListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: MaterialCategorySchema.optional(),
  favorite_only: z.coerce.boolean().optional(),
  folder_id: z.string().uuid().optional(),
  collection: z.string().trim().min(1).max(120).optional(),
  sort: SortSchema.optional(),
})

const MaterialCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(140),
  category: MaterialCategorySchema,
  favorite: z.boolean().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  collection: z.string().trim().max(120).nullable().optional(),
  texture_url: z.string().url().nullable().optional(),
  preview_url: z.string().url().nullable().optional(),
  scale_x_mm: z.number().positive().nullable().optional(),
  scale_y_mm: z.number().positive().nullable().optional(),
  rotation_deg: z.number().min(0).max(360).optional(),
  roughness: z.number().min(0).max(1).nullable().optional(),
  metallic: z.number().min(0).max(1).nullable().optional(),
  config_json: z.record(z.unknown()).optional(),
})

const MaterialPatchBodySchema = z.object({
  name: z.string().trim().min(1).max(140).optional(),
  category: MaterialCategorySchema.optional(),
  favorite: z.boolean().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  collection: z.string().trim().max(120).nullable().optional(),
  texture_url: z.string().url().nullable().optional(),
  preview_url: z.string().url().nullable().optional(),
  scale_x_mm: z.number().positive().nullable().optional(),
  scale_y_mm: z.number().positive().nullable().optional(),
  rotation_deg: z.number().min(0).max(360).optional(),
  roughness: z.number().min(0).max(1).nullable().optional(),
  metallic: z.number().min(0).max(1).nullable().optional(),
  config_json: z.record(z.unknown()).optional(),
})

const MaterialSurfaceAssignmentSchema = z.object({
  surface: SurfaceTargetSchema,
  material_item_id: z.string().uuid().nullable().optional(),
  uv_scale: z
    .object({
      x: z.number().positive(),
      y: z.number().positive(),
    })
    .optional(),
  rotation_deg: z.number().min(0).max(360).optional(),
})

const MaterialPlacementAssignmentSchema = z.object({
  placement_id: z.string().min(1),
  target_kind: z.enum(['placement', 'asset']).default('placement'),
  material_item_id: z.string().uuid().nullable().optional(),
  uv_scale: z
    .object({
      x: z.number().positive(),
      y: z.number().positive(),
    })
    .optional(),
  rotation_deg: z.number().min(0).max(360).optional(),
})

const ProjectMaterialAssignmentsBodySchema = z
  .object({
    room_id: z.string().uuid(),
    surface_assignments: z.array(MaterialSurfaceAssignmentSchema).max(16).default([]),
    placement_assignments: z.array(MaterialPlacementAssignmentSchema).max(500).default([]),
  })
  .refine(
    (value) => value.surface_assignments.length > 0 || value.placement_assignments.length > 0,
    'Mindestens eine Surface- oder Placement-Zuweisung ist erforderlich',
  )

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

type RoomSurfaceEntry = {
  surface: 'floor' | 'ceiling' | 'wall_north' | 'wall_south' | 'wall_east' | 'wall_west'
  color_hex?: string
  material_id?: string
  texture_url?: string
  uv_scale?: { x: number; y: number }
  rotation_deg?: number
  roughness?: number
  metallic?: number
}

type RoomColoringPayload = {
  surfaces: RoomSurfaceEntry[]
}

type PlacementPayload = {
  id?: string
  [key: string]: unknown
}

function ensureTenantScope(tenantId: string | null | undefined, reply: FastifyReply): tenantId is string {
  if (tenantId) return true
  reply.status(403).send({ error: 'FORBIDDEN', message: 'Missing tenant scope' })
  return false
}

function categoryForSurface(surface: RoomSurfaceEntry['surface']): MaterialCategory {
  if (surface === 'floor') return 'floor'
  return 'wall'
}

function categoryForPlacement(targetKind: 'placement' | 'asset'): MaterialCategory {
  if (targetKind === 'asset') return 'custom'
  return 'front'
}

function parseRoomColoring(input: unknown): RoomColoringPayload {
  if (!input || typeof input !== 'object') {
    return { surfaces: [] }
  }
  const candidate = input as { surfaces?: unknown }
  if (!Array.isArray(candidate.surfaces)) {
    return { surfaces: [] }
  }
  return {
    surfaces: candidate.surfaces
      .filter(
        (entry): entry is RoomSurfaceEntry =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as RoomSurfaceEntry).surface === 'string',
      )
      .map((entry) => ({ ...entry })),
  }
}

function parsePlacements(input: unknown): PlacementPayload[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((entry): entry is PlacementPayload => !!entry && typeof entry === 'object')
    .map((entry) => ({ ...entry }))
}

function mergeConfigJson(
  existing: unknown,
  patch?: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base = existing && typeof existing === 'object' ? (existing as Record<string, unknown>) : {}
  if (!patch) return base as Prisma.InputJsonValue
  return {
    ...base,
    ...patch,
  } as Prisma.InputJsonValue
}

function normalizeCollection(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized.slice(0, 120) : null
}

function buildOrderBy(sort: z.infer<typeof SortSchema> | undefined): Prisma.MaterialLibraryItemOrderByWithRelationInput[] {
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

async function ensureProjectInTenant(projectId: string, tenantId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      tenant_id: true,
    },
  })
  if (!project || project.tenant_id !== tenantId) {
    return null
  }
  return project
}

export async function materialLibraryRoutes(app: FastifyInstance) {
  app.get('/tenant/materials', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedQuery = MaterialListQuerySchema.safeParse(request.query)
    if (!parsedQuery.success) {
      return sendBadRequest(reply, parsedQuery.error.errors[0]?.message ?? 'Ungültige Filter')
    }

    const items = await prisma.materialLibraryItem.findMany({
      where: {
        tenant_id: tenantId,
        ...(parsedQuery.data.category ? { category: parsedQuery.data.category } : {}),
        ...(parsedQuery.data.folder_id ? { folder_id: parsedQuery.data.folder_id } : {}),
        ...(parsedQuery.data.collection ? { collection: parsedQuery.data.collection.trim() } : {}),
        ...(parsedQuery.data.favorite_only ? { favorite: true } : {}),
      },
      orderBy: buildOrderBy(parsedQuery.data.sort),
    })

    const query = parsedQuery.data.q?.toLowerCase()
    if (!query) {
      return reply.send(items)
    }

    const filtered = items.filter((item) => {
      return `${item.name} ${item.category} ${item.collection ?? ''}`.toLowerCase().includes(query)
    })

    return reply.send(filtered)
  })

  app.get('/tenant/materials/folders', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
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

  app.post('/tenant/materials/folders', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
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

  app.patch<{ Params: { id: string } }>('/tenant/materials/folders/:id', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
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

  app.delete<{ Params: { id: string } }>('/tenant/materials/folders/:id', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await ensureFolderInTenant(request.params.id, tenantId)
    if (!existing) {
      return sendNotFound(reply, 'Ordner nicht gefunden')
    }

    const [childrenCount, itemsCount] = await Promise.all([
      prisma.libraryFolder.count({ where: { tenant_id: tenantId, kind: LIBRARY_KIND, parent_id: existing.id } }),
      prisma.materialLibraryItem.count({ where: { tenant_id: tenantId, folder_id: existing.id } }),
    ])

    if (childrenCount > 0 || itemsCount > 0) {
      return sendBadRequest(reply, 'Ordner ist nicht leer')
    }

    await prisma.libraryFolder.delete({ where: { id: existing.id } })
    return reply.status(204).send()
  })

  app.get('/tenant/materials/saved-filters', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
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

  app.post('/tenant/materials/saved-filters', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
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

  app.delete<{ Params: { id: string } }>('/tenant/materials/saved-filters/:id', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await prisma.librarySavedFilter.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId || existing.kind !== LIBRARY_KIND) {
      return sendNotFound(reply, 'Filter nicht gefunden')
    }

    await prisma.librarySavedFilter.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post('/tenant/materials', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = MaterialCreateBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Materialdaten')
    }

    if (parsedBody.data.folder_id) {
      const folder = await ensureFolderInTenant(parsedBody.data.folder_id, tenantId)
      if (!folder) {
        return sendBadRequest(reply, 'Ordner nicht gefunden')
      }
    }

    const created = await prisma.materialLibraryItem.create({
      data: {
        tenant_id: tenantId,
        name: parsedBody.data.name,
        category: parsedBody.data.category,
        favorite: parsedBody.data.favorite ?? false,
        folder_id: parsedBody.data.folder_id ?? null,
        collection: normalizeCollection(parsedBody.data.collection),
        texture_url: parsedBody.data.texture_url ?? null,
        preview_url: parsedBody.data.preview_url ?? null,
        scale_x_mm: parsedBody.data.scale_x_mm ?? null,
        scale_y_mm: parsedBody.data.scale_y_mm ?? null,
        rotation_deg: parsedBody.data.rotation_deg ?? 0,
        roughness: parsedBody.data.roughness ?? null,
        metallic: parsedBody.data.metallic ?? null,
        config_json: mergeConfigJson({}, parsedBody.data.config_json),
      },
    })

    return reply.status(201).send(created)
  })

  app.patch<{ Params: { id: string } }>('/tenant/materials/:id', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = MaterialPatchBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Materialdaten')
    }

    const existing = await prisma.materialLibraryItem.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Material nicht gefunden')
    }

    if (parsedBody.data.folder_id) {
      const folder = await ensureFolderInTenant(parsedBody.data.folder_id, tenantId)
      if (!folder) {
        return sendBadRequest(reply, 'Ordner nicht gefunden')
      }
    }

    const updated = await prisma.materialLibraryItem.update({
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
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'texture_url')
          ? { texture_url: parsedBody.data.texture_url ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'preview_url')
          ? { preview_url: parsedBody.data.preview_url ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'scale_x_mm')
          ? { scale_x_mm: parsedBody.data.scale_x_mm ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'scale_y_mm')
          ? { scale_y_mm: parsedBody.data.scale_y_mm ?? null }
          : {}),
        ...(parsedBody.data.rotation_deg !== undefined ? { rotation_deg: parsedBody.data.rotation_deg } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'roughness')
          ? { roughness: parsedBody.data.roughness ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsedBody.data, 'metallic')
          ? { metallic: parsedBody.data.metallic ?? null }
          : {}),
        ...(parsedBody.data.config_json
          ? { config_json: mergeConfigJson(existing.config_json, parsedBody.data.config_json) }
          : {}),
      },
    })

    return reply.send(updated)
  })

  app.delete<{ Params: { id: string } }>('/tenant/materials/:id', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const existing = await prisma.materialLibraryItem.findUnique({ where: { id: request.params.id } })
    if (!existing || existing.tenant_id !== tenantId) {
      return sendNotFound(reply, 'Material nicht gefunden')
    }

    await prisma.materialLibraryItem.delete({ where: { id: request.params.id } })
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/projects/:id/material-assignments', async (request, reply) => {
    if (!ensureTenantScope(request.tenantId, reply)) return
    const tenantId = request.tenantId

    const parsedBody = ProjectMaterialAssignmentsBodySchema.safeParse(request.body ?? {})
    if (!parsedBody.success) {
      return sendBadRequest(reply, parsedBody.error.errors[0]?.message ?? 'Ungültige Materialzuweisungen')
    }

    const project = await ensureProjectInTenant(request.params.id, tenantId)
    if (!project) {
      return sendNotFound(reply, 'Projekt nicht gefunden')
    }

    const room = await prisma.room.findUnique({
      where: { id: parsedBody.data.room_id },
      select: {
        id: true,
        project_id: true,
        coloring: true,
        placements: true,
      },
    })

    if (!room || room.project_id !== project.id) {
      return sendBadRequest(reply, 'Raum gehört nicht zum Projekt')
    }

    const requestedMaterialIds = [
      ...parsedBody.data.surface_assignments.map((entry) => entry.material_item_id).filter((value): value is string => !!value),
      ...parsedBody.data.placement_assignments.map((entry) => entry.material_item_id).filter((value): value is string => !!value),
    ]

    const uniqueMaterialIds = [...new Set(requestedMaterialIds)]

    const materialItems = uniqueMaterialIds.length > 0
      ? await prisma.materialLibraryItem.findMany({
          where: {
            tenant_id: tenantId,
            id: { in: uniqueMaterialIds },
          },
        })
      : []

    const materialById = new Map(materialItems.map((entry) => [entry.id, entry]))
    const missing = uniqueMaterialIds.filter((id) => !materialById.has(id))
    if (missing.length > 0) {
      return sendBadRequest(reply, 'Mindestens ein Material gehört nicht zum Tenant oder existiert nicht')
    }

    const coloring = parseRoomColoring(room.coloring)
    const placements = parsePlacements(room.placements)

    const resolvedSurfaces: Array<{ surface: string; material: ReturnType<typeof resolveMaterialAssignment> }> = []
    const resolvedPlacements: Array<{ placement_id: string; material: ReturnType<typeof resolveMaterialAssignment> }> = []

    for (const assignment of parsedBody.data.surface_assignments) {
      const material = assignment.material_item_id ? materialById.get(assignment.material_item_id) ?? null : null
      const resolved = resolveMaterialAssignment({
        assignment,
        materialItem: material ?? undefined,
        fallbackCategory: categoryForSurface(assignment.surface),
      })

      const index = coloring.surfaces.findIndex((entry) => entry.surface === assignment.surface)
      const previous = index >= 0 ? coloring.surfaces[index] : { surface: assignment.surface }
      const nextEntry: RoomSurfaceEntry = {
        ...previous,
        surface: assignment.surface,
        material_id: resolved.material_item_id ?? undefined,
        texture_url: resolved.texture_url ?? undefined,
        color_hex: previous.color_hex ?? resolved.color_hex,
        uv_scale: resolved.uv_scale,
        rotation_deg: resolved.rotation_deg,
        roughness: resolved.roughness,
        metallic: resolved.metallic,
      }

      if (index >= 0) {
        coloring.surfaces[index] = nextEntry
      } else {
        coloring.surfaces.push(nextEntry)
      }

      resolvedSurfaces.push({ surface: assignment.surface, material: resolved })
    }

    for (const assignment of parsedBody.data.placement_assignments) {
      const targetIndex = placements.findIndex((placement) => placement.id === assignment.placement_id)
      if (targetIndex < 0) {
        return sendBadRequest(reply, `Placement ${assignment.placement_id} nicht gefunden`) 
      }

      const material = assignment.material_item_id ? materialById.get(assignment.material_item_id) ?? null : null
      const resolved = resolveMaterialAssignment({
        assignment,
        materialItem: material ?? undefined,
        fallbackCategory: categoryForPlacement(assignment.target_kind),
      })

      const placement = placements[targetIndex]
      const currentAssignment =
        placement.material_assignment && typeof placement.material_assignment === 'object'
          ? (placement.material_assignment as Record<string, unknown>)
          : {}

      placements[targetIndex] = {
        ...placement,
        material_assignment: {
          ...currentAssignment,
          target_kind: assignment.target_kind,
          material_item_id: resolved.material_item_id,
          texture_url: resolved.texture_url,
          color_hex: resolved.color_hex,
          roughness: resolved.roughness,
          metallic: resolved.metallic,
          uv_scale: resolved.uv_scale,
          rotation_deg: resolved.rotation_deg,
        },
      }

      resolvedPlacements.push({ placement_id: assignment.placement_id, material: resolved })
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        coloring: coloring as unknown as Prisma.InputJsonValue,
        placements: placements as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        coloring: true,
        placements: true,
      },
    })

    return reply.send({
      room_id: updated.id,
      coloring: updated.coloring,
      placements: updated.placements,
      resolved: {
        surfaces: resolvedSurfaces,
        placements: resolvedPlacements,
      },
    })
  })
}
