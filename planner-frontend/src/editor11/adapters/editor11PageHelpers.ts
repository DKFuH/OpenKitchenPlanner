import { type CatalogArticle } from '../../api/catalog.js'
import { type ReferenceImagePayload, type RoomPayload } from '../../api/rooms.js'
import type { EditorState } from '../../editor/usePolygonEditor.js'

export function resolveArticleVariantId(article: CatalogArticle, chosenOptions: Record<string, string>): string | undefined {
  if (!article.variants || article.variants.length === 0) {
    return undefined
  }

  for (const variant of article.variants) {
    const values = (variant.variant_values_json ?? {}) as Record<string, unknown>
    const keys = Object.keys(values)
    if (keys.length === 0) {
      continue
    }

    const matches = keys.every((key) => {
      const selected = chosenOptions[key]
      if (selected == null || selected.trim() === '') {
        return false
      }
      return String(values[key]) === selected
    })

    if (matches) {
      return variant.id
    }
  }

  return undefined
}

export function resolveArticlePriceForVariant(article: CatalogArticle, variantId?: string) {
  const prices = article.prices ?? []
  if (prices.length === 0) {
    return undefined
  }

  if (variantId) {
    const variantPrice = prices.find((price) => price.article_variant_id === variantId)
    if (variantPrice) {
      return variantPrice
    }
  }

  const defaultPrice = prices.find((price) => !price.article_variant_id)
  return defaultPrice ?? prices[0]
}

export function parseReferenceImage(raw: unknown): NonNullable<EditorState['referenceImage']> | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<ReferenceImagePayload>
  if (typeof candidate.url !== 'string' || candidate.url.length === 0) return null

  return {
    url: candidate.url,
    x: typeof candidate.x === 'number' ? candidate.x : 50,
    y: typeof candidate.y === 'number' ? candidate.y : 50,
    rotation: typeof candidate.rotation === 'number' ? candidate.rotation : 0,
    scale: typeof candidate.scale === 'number' ? candidate.scale : 1,
    opacity: typeof candidate.opacity === 'number' ? candidate.opacity : 0.5,
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function extractRoomVertices(boundary: unknown): Array<{ x_mm: number; y_mm: number }> {
  const candidate = asRecord(boundary)
  if (!candidate) return []
  if (!Array.isArray(candidate.vertices)) return []

  const vertices: Array<{ x_mm: number; y_mm: number }> = []
  for (const entry of candidate.vertices) {
    const vertex = asRecord(entry)
    if (!vertex) continue
    if (typeof vertex.x_mm !== 'number' || !Number.isFinite(vertex.x_mm)) continue
    if (typeof vertex.y_mm !== 'number' || !Number.isFinite(vertex.y_mm)) continue
    vertices.push({ x_mm: vertex.x_mm, y_mm: vertex.y_mm })
  }

  return vertices
}

export function buildFootprintFromRoom(room: RoomPayload): Record<string, unknown> {
  const vertices = extractRoomVertices(room.boundary)

  if (vertices.length === 0) {
    return {
      room_id: room.id,
      rect: {
        x_mm: 0,
        y_mm: 0,
        width_mm: 1,
        depth_mm: 1,
      },
    }
  }

  const xs = vertices.map((vertex) => vertex.x_mm)
  const ys = vertices.map((vertex) => vertex.y_mm)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    room_id: room.id,
    rect: {
      x_mm: minX,
      y_mm: minY,
      width_mm: Math.max(1, maxX - minX),
      depth_mm: Math.max(1, maxY - minY),
    },
    ...(vertices.length >= 3 ? { vertices } : {}),
  }
}

export function buildDefaultSectionLine(room: RoomPayload) {
  const vertices = extractRoomVertices(room.boundary)

  if (vertices.length < 2) {
    return {
      start: { x_mm: 0, y_mm: 0 },
      end: { x_mm: 2000, y_mm: 0 },
    }
  }

  const xs = vertices.map((vertex) => vertex.x_mm)
  const ys = vertices.map((vertex) => vertex.y_mm)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerY = (minY + maxY) * 0.5

  return {
    start: { x_mm: minX, y_mm: centerY },
    end: { x_mm: maxX, y_mm: centerY },
  }
}
