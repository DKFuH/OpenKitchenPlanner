import { useCallback } from 'react'
import type { MutableRefObject, Dispatch, SetStateAction } from 'react'
import type { Opening } from '../../api/openings.js'
import { openingsApi } from '../../api/openings.js'
import type { Placement } from '../../api/placements.js'
import { placementsApi } from '../../api/placements.js'
import type { CatalogArticle, UnifiedCatalogItem } from '../../api/catalog.js'
import type { RoomPayload } from '../../api/rooms.js'
import { normalizeOpeningForMultiview } from '../../editor/roomTopology.js'

interface ConfiguredDimensions {
  width_mm: number
  height_mm: number
  depth_mm: number
}

interface UseEditor11EntityMutationsArgs {
  selectedRoomRef: MutableRefObject<RoomPayload | null>
  openingsRef: MutableRefObject<Opening[]>
  placementsRef: MutableRefObject<Placement[]>
  setOpenings: Dispatch<SetStateAction<Opening[]>>
  setSelectedOpeningId: Dispatch<SetStateAction<string | null>>
  setPlacements: Dispatch<SetStateAction<Placement[]>>
  setSelectedPlacementId: Dispatch<SetStateAction<string | null>>
  selectedCatalogItem: UnifiedCatalogItem | null
  configuredDimensions: ConfiguredDimensions | null
  chosenOptions: Record<string, string>
  resetToSelection: () => void
  resolveArticleVariantId: (article: CatalogArticle, options: Record<string, string>) => string | undefined
  resolveArticlePriceForVariant: (article: CatalogArticle, variantId: string | undefined) => {
    list_net: number
    dealer_net: number
    tax_group_id?: string | null
  } | undefined
}

export function useEditor11EntityMutations({
  selectedRoomRef,
  openingsRef,
  placementsRef,
  setOpenings,
  setSelectedOpeningId,
  setPlacements,
  setSelectedPlacementId,
  selectedCatalogItem,
  configuredDimensions,
  chosenOptions,
  resetToSelection,
  resolveArticleVariantId,
  resolveArticlePriceForVariant,
}: UseEditor11EntityMutationsArgs) {
  const handleSaveOpenings = useCallback(async (newOpenings: Opening[]) => {
    if (!selectedRoomRef.current) return
    try {
      const saved = await openingsApi.save(selectedRoomRef.current.id, newOpenings)
      setOpenings(saved)
    } catch (e) {
      console.error('Oeffnungen speichern fehlgeschlagen:', e)
    }
  }, [selectedRoomRef, setOpenings])

  const handleAddOpening = useCallback((wallId: string, wallLengthMm: number) => {
    const defaultWidth = Math.min(900, wallLengthMm)
    const offset = Math.max(0, Math.round((wallLengthMm - defaultWidth) / 2))
    const newOpening = normalizeOpeningForMultiview({
      id: crypto.randomUUID(),
      wall_id: wallId,
      type: 'door',
      offset_mm: offset,
      width_mm: defaultWidth,
      height_mm: 2100,
      sill_height_mm: 0,
      source: 'manual',
    })
    const updated = [...openingsRef.current, newOpening]
    setOpenings(updated)
    setSelectedOpeningId(newOpening.id)
    void handleSaveOpenings(updated)
    resetToSelection()
  }, [handleSaveOpenings, openingsRef, resetToSelection, setOpenings, setSelectedOpeningId])

  const handleUpdateOpening = useCallback((updated: Opening) => {
    const normalized = normalizeOpeningForMultiview(updated)
    const newOpenings = openingsRef.current.map((opening) => (
      opening.id === normalized.id ? normalized : opening
    ))
    setOpenings(newOpenings)
    void handleSaveOpenings(newOpenings)
  }, [handleSaveOpenings, openingsRef, setOpenings])

  const handleDeleteOpening = useCallback((openingId: string) => {
    const newOpenings = openingsRef.current.filter((opening) => opening.id !== openingId)
    setOpenings(newOpenings)
    setSelectedOpeningId((previous) => (previous === openingId ? null : previous))
    void handleSaveOpenings(newOpenings)
  }, [handleSaveOpenings, openingsRef, setOpenings, setSelectedOpeningId])

  const handleSavePlacements = useCallback(async (newPlacements: Placement[]) => {
    if (!selectedRoomRef.current) return
    try {
      const saved = await placementsApi.save(selectedRoomRef.current.id, newPlacements)
      setPlacements(saved)
    } catch (e) {
      console.error('Platzierungen speichern fehlgeschlagen:', e)
    }
  }, [selectedRoomRef, setPlacements])

  const handleAddPlacement = useCallback((wallId: string, wallLengthMm: number) => {
    if (!selectedCatalogItem) {
      console.warn('Kein Katalogartikel ausgewaehlt')
      return
    }

    const isArticle = 'base_dims_json' in selectedCatalogItem
    const article = isArticle ? (selectedCatalogItem as CatalogArticle) : null

    const itemWidth = isArticle ? selectedCatalogItem.base_dims_json.width_mm : selectedCatalogItem.width_mm
    const itemHeight = isArticle ? selectedCatalogItem.base_dims_json.height_mm : selectedCatalogItem.height_mm
    const itemDepth = isArticle ? selectedCatalogItem.base_dims_json.depth_mm : selectedCatalogItem.depth_mm

    const dims = configuredDimensions ?? {
      width_mm: itemWidth,
      height_mm: itemHeight,
      depth_mm: itemDepth,
    }

    const cleanedChosenOptions = Object.fromEntries(
      Object.entries(chosenOptions).filter(([, value]) => value.trim() !== ''),
    )
    const resolvedVariantId = article ? resolveArticleVariantId(article, cleanedChosenOptions) : undefined
    const resolvedArticlePrice = article ? resolveArticlePriceForVariant(article, resolvedVariantId) : undefined

    const placementWidth = Math.max(1, dims.width_mm)
    const offset = Math.max(0, Math.round((wallLengthMm - placementWidth) / 2))
    const newPlacement: Placement = {
      id: crypto.randomUUID(),
      catalog_item_id: selectedCatalogItem.id,
      ...(isArticle ? { catalog_article_id: selectedCatalogItem.id } : {}),
      ...(resolvedVariantId ? { article_variant_id: resolvedVariantId } : {}),
      description: selectedCatalogItem.name,
      ...(isArticle && Object.keys(cleanedChosenOptions).length > 0 ? { chosen_options: cleanedChosenOptions } : {}),
      ...(isArticle && resolvedArticlePrice
        ? {
            list_price_net: resolvedArticlePrice.list_net,
            dealer_price_net: resolvedArticlePrice.dealer_net,
            ...(resolvedArticlePrice.tax_group_id ? { tax_group_id: resolvedArticlePrice.tax_group_id } : {}),
          }
        : {}),
      ...(!isArticle ? { list_price_net: selectedCatalogItem.list_price_net } : {}),
      ...(!isArticle && selectedCatalogItem.dealer_price_net != null
        ? { dealer_price_net: selectedCatalogItem.dealer_price_net }
        : {}),
      wall_id: wallId,
      offset_mm: offset,
      width_mm: placementWidth,
      depth_mm: Math.max(1, dims.depth_mm),
      height_mm: Math.max(1, dims.height_mm),
    }

    const updated = [...placementsRef.current, newPlacement]
    setPlacements(updated)
    setSelectedPlacementId(newPlacement.id)
    void handleSavePlacements(updated)
    resetToSelection()
  }, [
    chosenOptions,
    configuredDimensions,
    handleSavePlacements,
    placementsRef,
    resetToSelection,
    resolveArticlePriceForVariant,
    resolveArticleVariantId,
    selectedCatalogItem,
    setPlacements,
    setSelectedPlacementId,
  ])

  const handleUpdatePlacement = useCallback((updated: Placement) => {
    const nextPlacements = placementsRef.current.map((placement) => (
      placement.id === updated.id ? updated : placement
    ))
    setPlacements(nextPlacements)
    void handleSavePlacements(nextPlacements)
  }, [handleSavePlacements, placementsRef, setPlacements])

  const handleDeletePlacement = useCallback((placementId: string) => {
    const nextPlacements = placementsRef.current.filter((placement) => placement.id !== placementId)
    setPlacements(nextPlacements)
    setSelectedPlacementId((current) => (current === placementId ? null : current))
    void handleSavePlacements(nextPlacements)
  }, [handleSavePlacements, placementsRef, setPlacements, setSelectedPlacementId])

  const handleBoundaryTopologyRebind = useCallback((payload: {
    openings: Opening[]
    placements: Placement[]
    changedOpenings: number
    changedPlacements: number
  }) => {
    if (payload.changedOpenings > 0) {
      setOpenings(payload.openings)
      setSelectedOpeningId((previous) => (
        previous && !payload.openings.some((opening) => opening.id === previous) ? null : previous
      ))
      void handleSaveOpenings(payload.openings)
    }

    if (payload.changedPlacements > 0) {
      setPlacements(payload.placements)
      setSelectedPlacementId((previous) => (
        previous && !payload.placements.some((placement) => placement.id === previous) ? null : previous
      ))
      void handleSavePlacements(payload.placements)
    }
  }, [
    handleSaveOpenings,
    handleSavePlacements,
    setOpenings,
    setPlacements,
    setSelectedOpeningId,
    setSelectedPlacementId,
  ])

  return {
    handleSaveOpenings,
    handleAddOpening,
    handleUpdateOpening,
    handleDeleteOpening,
    handleSavePlacements,
    handleAddPlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    handleBoundaryTopologyRebind,
  }
}
