import type { Placement } from '../../api/placements.js'
import { previewBom, toQuoteBomLines, type BomPreviewRequest } from '../../api/bom.js'
import { QuoteExportPanel } from '../../components/quotes/QuoteExportPanel.js'

interface QuoteExportSectionProps {
  projectId: string
  selectedRoomId: string | null
  placements: Placement[]
}

export function QuoteExportSection({
  projectId,
  selectedRoomId,
  placements,
}: QuoteExportSectionProps) {
  async function buildCreatePayload() {
    const taxGroupId = 'tax-default'
    const taxRate = 0.19

    const placementWithPricing = placements.filter((placement) => placement.list_price_net != null)
    const priceListItems = placementWithPricing
      .filter((placement) => !placement.catalog_article_id)
      .map((placement) => ({
        catalog_item_id: placement.catalog_item_id,
        list_price_net: placement.list_price_net ?? 0,
        dealer_price_net: placement.dealer_price_net ?? 0,
      }))

    const articlePrices = placementWithPricing
      .filter((placement) => placement.catalog_article_id)
      .map((placement) => ({
        article_id: placement.catalog_article_id as string,
        ...(placement.article_variant_id ? { article_variant_id: placement.article_variant_id } : {}),
        list_net: placement.list_price_net ?? 0,
        dealer_net: placement.dealer_price_net ?? 0,
        tax_group_id: placement.tax_group_id ?? taxGroupId,
      }))

    const cabinets: BomPreviewRequest['project']['cabinets'] = placements.map((placement) => ({
      ...placement,
      id: placement.id,
      tax_group_id: placement.tax_group_id ?? taxGroupId,
      qty: 1,
      pricing_group_discount_pct: 0,
      position_discount_pct: 0,
      flags: {
        requires_customization: false,
        height_variant: null,
        labor_surcharge: false,
        special_trim_needed: false,
      },
    }))

    const payload: BomPreviewRequest = {
      project: {
        id: projectId,
        cabinets,
        appliances: [],
        accessories: [],
        articlePrices,
        priceListItems,
        taxGroups: [{ id: taxGroupId, name: 'Standard', tax_rate: taxRate }],
        quoteSettings: {
          freight_flat_rate: 89,
          assembly_rate_per_item: 45,
        },
      },
      ...(selectedRoomId
        ? {
            options: {
              includeGeneratedItems: true,
              room_id: selectedRoomId,
            },
          }
        : {}),
    }

    const preview = await previewBom(payload)
    return {
      bom_lines: toQuoteBomLines(preview.lines),
      price_summary: {
        subtotal_net: preview.totals.total_net_after_discounts,
        total_gross: preview.totals.total_net_after_discounts * (1 + taxRate),
      },
    }
  }

  return (
    <QuoteExportPanel
      projectId={projectId}
      buildCreatePayload={buildCreatePayload}
    />
  )
}
