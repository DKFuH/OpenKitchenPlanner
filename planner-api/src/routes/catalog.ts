import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'

const CatalogTypeSchema = z.enum([
  'base_cabinet',
  'wall_cabinet',
  'tall_cabinet',
  'trim',
  'worktop',
  'appliance',
  'accessory',
])

const ListCatalogQuerySchema = z.object({
  type: CatalogTypeSchema.optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

const CatalogItemIdParamSchema = z.object({
  id: z.string().uuid(),
})

const SkpTargetTypeSchema = z.enum([
  'cabinet',
  'appliance',
  'reference_object',
  'ignored',
])

const SkpComponentDimensionsSchema = z.object({
  width_mm: z.number().int().positive(),
  height_mm: z.number().int().positive(),
  depth_mm: z.number().int().positive(),
})

const SkpComponentMappingSchema = z.object({
  target_type: SkpTargetTypeSchema,
  catalog_item_id: z.string().min(1).max(255).nullable().optional(),
  label: z.string().min(1).max(255).nullable().optional(),
})

const SuggestSkpMappingsSchema = z.object({
  candidate_limit: z.coerce.number().int().min(1).max(10).default(3),
  components: z.array(
    z.object({
      id: z.string().min(1).max(255),
      skp_component_name: z.string().min(1).max(255),
      dimensions: SkpComponentDimensionsSchema.nullable().optional(),
      mapping: SkpComponentMappingSchema.nullable().optional(),
    }),
  ).min(1).max(200),
})

type CatalogListItem = {
  id: string
  sku: string
  name: string
  type: z.infer<typeof CatalogTypeSchema>
  width_mm: number
  height_mm: number
  depth_mm: number
  list_price_net: number
  dealer_price_net: number | null
  default_markup_pct: number | null
  tax_group_id: string | null
  pricing_group_id: string | null
}

type SkpComponentInput = z.infer<typeof SuggestSkpMappingsSchema>['components'][number]
type SkpTargetType = z.infer<typeof SkpTargetTypeSchema>

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function inferTargetType(component: SkpComponentInput): SkpTargetType {
  if (component.mapping?.target_type) {
    return component.mapping.target_type
  }

  const name = component.skp_component_name.toLowerCase()
  const dimensions = component.dimensions

  if (
    name.includes('kuehlschrank') ||
    name.includes('kühlschrank') ||
    name.includes('oven') ||
    name.includes('herd') ||
    name.includes('spuele') ||
    name.includes('spüle') ||
    name.includes('dishwasher') ||
    name.includes('geraet') ||
    name.includes('gerät')
  ) {
    return 'appliance'
  }

  if (
    name.includes('us_') ||
    name.includes('unterschrank') ||
    name.includes('hs_') ||
    name.includes('haengeschrank') ||
    name.includes('hängeschrank') ||
    name.includes('schrank') ||
    name.includes('cabinet')
  ) {
    return 'cabinet'
  }

  if (
    dimensions &&
    dimensions.height_mm >= 700 &&
    dimensions.height_mm <= 2300 &&
    dimensions.depth_mm >= 300 &&
    dimensions.depth_mm <= 700
  ) {
    return 'cabinet'
  }

  return 'reference_object'
}

function getCatalogTypesForTargetType(targetType: SkpTargetType): Array<z.infer<typeof CatalogTypeSchema>> {
  switch (targetType) {
    case 'cabinet':
      return ['base_cabinet', 'wall_cabinet', 'tall_cabinet']
    case 'appliance':
      return ['appliance']
    default:
      return []
  }
}

function getNameMatchScore(componentName: string, item: CatalogListItem): number {
  const normalizedComponentName = normalizeForMatch(componentName)
  const normalizedSku = normalizeForMatch(item.sku)
  const normalizedItemName = normalizeForMatch(item.name)
  const widthToken = String(item.width_mm)
  let score = 0

  if (normalizedSku.length > 0 && normalizedComponentName.includes(normalizedSku)) {
    score += 55
  }
  if (normalizedItemName.length > 0 && normalizedComponentName.includes(normalizedItemName)) {
    score += 35
  }
  if (normalizedComponentName.includes(widthToken)) {
    score += 10
  }

  return score
}

function getDimensionMatchScore(
  dimensions: SkpComponentInput['dimensions'],
  item: CatalogListItem,
): number {
  if (!dimensions) {
    return 0
  }

  const axes: Array<['width_mm' | 'height_mm' | 'depth_mm', number]> = [
    ['width_mm', 0.5],
    ['height_mm', 0.2],
    ['depth_mm', 0.3],
  ]

  const weightedDifference = axes.reduce((sum, [axis, weight]) => {
    const componentValue = dimensions[axis]
    const itemValue = item[axis]
    const relativeDifference = Math.abs(componentValue - itemValue) / Math.max(componentValue, itemValue, 1)
    return sum + (relativeDifference * weight)
  }, 0)

  return Math.max(0, 1 - weightedDifference) * 100
}

function getMatchScore(component: SkpComponentInput, item: CatalogListItem): number {
  const targetType = inferTargetType(component)
  const typeScore = getCatalogTypesForTargetType(targetType).includes(item.type) ? 20 : 0
  const nameScore = getNameMatchScore(component.skp_component_name, item)
  const dimensionScore = getDimensionMatchScore(component.dimensions, item)

  return Math.round(typeScore + nameScore + dimensionScore)
}

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/catalog/items', async (request, reply) => {
    const parsed = ListCatalogQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0].message)
    }

    const { type, q, limit, offset } = parsed.data

    const items = await prisma.catalogItem.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        sku: true,
        name: true,
        type: true,
        width_mm: true,
        height_mm: true,
        depth_mm: true,
        list_price_net: true,
        dealer_price_net: true,
        default_markup_pct: true,
        tax_group_id: true,
        pricing_group_id: true,
      },
    })

    return reply.send(items)
  })

  app.get<{ Params: { id: string } }>('/catalog/items/:id', async (request, reply) => {
    const parsedParams = CatalogItemIdParamSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return sendBadRequest(reply, parsedParams.error.errors[0].message)
    }

    const item = await prisma.catalogItem.findUnique({
      where: { id: parsedParams.data.id },
      select: {
        id: true,
        sku: true,
        name: true,
        type: true,
        width_mm: true,
        height_mm: true,
        depth_mm: true,
        list_price_net: true,
        dealer_price_net: true,
        default_markup_pct: true,
        tax_group_id: true,
        pricing_group_id: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!item) {
      return sendNotFound(reply, 'Catalog item not found')
    }

    return reply.send(item)
  })

  app.post('/catalog/skp-mapping', async (request, reply) => {
    const parsed = SuggestSkpMappingsSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendBadRequest(reply, parsed.error.errors[0].message)
    }

    const requestedTypes = Array.from(
      new Set(
        parsed.data.components.flatMap((component) =>
          getCatalogTypesForTargetType(inferTargetType(component)),
        ),
      ),
    )

    const candidateItems: CatalogListItem[] =
      requestedTypes.length === 0
        ? []
        : await prisma.catalogItem.findMany({
            where: { type: { in: requestedTypes } },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              sku: true,
              name: true,
              type: true,
              width_mm: true,
              height_mm: true,
              depth_mm: true,
              list_price_net: true,
              dealer_price_net: true,
              default_markup_pct: true,
              tax_group_id: true,
              pricing_group_id: true,
            },
          })

    const mappings = parsed.data.components.map((component) => {
      const targetType = inferTargetType(component)
      const supportedTypes = getCatalogTypesForTargetType(targetType)

      if (targetType === 'ignored') {
        return {
          component_id: component.id,
          target_type: targetType,
          catalog_item_id: null,
          label: component.mapping?.label ?? component.skp_component_name,
          needs_review: false,
          candidates: [],
        }
      }

      if (targetType === 'reference_object') {
        return {
          component_id: component.id,
          target_type: targetType,
          catalog_item_id: null,
          label: component.mapping?.label ?? component.skp_component_name,
          needs_review: true,
          candidates: [],
        }
      }

      const rankedCandidates = candidateItems
        .filter((item) => supportedTypes.includes(item.type))
        .map((item) => ({
          ...item,
          match_score: getMatchScore(component, item),
        }))
        .sort((left, right) => right.match_score - left.match_score)
        .slice(0, parsed.data.candidate_limit)

      const explicitCatalogItemId = component.mapping?.catalog_item_id ?? null
      const topCandidate = rankedCandidates[0] ?? null
      const catalogItemId =
        explicitCatalogItemId ??
        (topCandidate && topCandidate.match_score >= 60 ? topCandidate.id : null)

      return {
        component_id: component.id,
        target_type: targetType,
        catalog_item_id: catalogItemId,
        label: component.mapping?.label ?? component.skp_component_name,
        needs_review: explicitCatalogItemId ? false : catalogItemId === null,
        candidates: rankedCandidates,
      }
    })

    return reply.send({ mappings })
  })
}
