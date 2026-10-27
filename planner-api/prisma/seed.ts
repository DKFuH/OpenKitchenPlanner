import { ArticleType, CatalogItemType, GrainDir, PrismaClient } from '@prisma/client'
import { readdir, readFile } from 'node:fs/promises'

const prisma = new PrismaClient()

const TAX_GROUP_ID = '10000000-0000-4000-8000-000000000001'
const PRICING_GROUP_ID = '10000000-0000-4000-8000-000000000002'
const PRICE_LIST_ID = '10000000-0000-4000-8000-000000000003'
const MANUFACTURER_ID = '10000000-0000-4000-8000-000000000004'

const templateRoot = new URL('../../planner-frontend/object-library/', import.meta.url)
interface CatalogTemplate {
  name: string
  category: CatalogItemType
  dimensions: { width_mm: number; height_mm: number; depth_mm: number }
  catalog?: { id: string; sku: string; list_price_net: number; dealer_price_net: number }
  manufacturer_article?: {
    id: string; sku: string; name: string; list_net: number; dealer_net: number
    options: Array<{ id: string; key: string; values: string[] }>
    variants: Array<{ id: string; key: string; values: Record<string, string> }>
  }
}
const templates: CatalogTemplate[] = []
for (const entry of await readdir(templateRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  templates.push(JSON.parse(await readFile(new URL(`${entry.name}/template.json`, templateRoot), 'utf8')))
}
const legacyItems = templates.filter(template => template.catalog).map(template => {
  const catalog = template.catalog!
  const dims = template.dimensions
  return [catalog.id, catalog.sku, template.name, template.category, dims.width_mm, dims.height_mm, dims.depth_mm, catalog.list_price_net, catalog.dealer_price_net] as const
})
const articles = templates.filter(template => template.manufacturer_article).map(template => ({
  ...template.manufacturer_article!,
  article_type: template.category as ArticleType,
  dims: template.dimensions,
}))
async function seed() {
  await prisma.taxGroup.upsert({
    where: { id: TAX_GROUP_ID },
    update: { name: 'Standard DE 19 %', tax_rate: 0.19 },
    create: { id: TAX_GROUP_ID, name: 'Standard DE 19 %', tax_rate: 0.19 },
  })
  await prisma.pricingGroup.upsert({
    where: { id: PRICING_GROUP_ID },
    update: { name: 'Küchenmöbel', default_discount_pct: 0 },
    create: { id: PRICING_GROUP_ID, name: 'Küchenmöbel', default_discount_pct: 0 },
  })
  await prisma.priceList.upsert({
    where: { id: PRICE_LIST_ID },
    update: { name: 'OKP Starterpreisliste', valid_from: new Date('2026-01-01T00:00:00.000Z') },
    create: { id: PRICE_LIST_ID, name: 'OKP Starterpreisliste', valid_from: new Date('2026-01-01T00:00:00.000Z') },
  })

  for (const [id, sku, name, type, width_mm, height_mm, depth_mm, list_price_net, dealer_price_net] of legacyItems) {
    const item = await prisma.catalogItem.upsert({
      where: { sku },
      update: { name, type, width_mm, height_mm, depth_mm, list_price_net, dealer_price_net, tax_group_id: TAX_GROUP_ID, pricing_group_id: PRICING_GROUP_ID },
      create: { id, sku, name, type, width_mm, height_mm, depth_mm, list_price_net, dealer_price_net, tax_group_id: TAX_GROUP_ID, pricing_group_id: PRICING_GROUP_ID },
    })
    await prisma.priceListItem.upsert({
      where: { price_list_id_catalog_item_id: { price_list_id: PRICE_LIST_ID, catalog_item_id: item.id } },
      update: { list_price_net, dealer_price_net },
      create: { price_list_id: PRICE_LIST_ID, catalog_item_id: item.id, list_price_net, dealer_price_net },
    })
  }

  const manufacturer = await prisma.manufacturer.upsert({
    where: { code: 'OKP-START' },
    update: { name: 'OKP Starterküche' },
    create: { id: MANUFACTURER_ID, code: 'OKP-START', name: 'OKP Starterküche' },
  })

  for (const article of articles) {
    const saved = await prisma.catalogArticle.upsert({
      where: { manufacturer_id_sku: { manufacturer_id: manufacturer.id, sku: article.sku } },
      update: { name: article.name, article_type: article.article_type, base_dims_json: article.dims, grain_direction: GrainDir.none },
      create: { id: article.id, manufacturer_id: manufacturer.id, sku: article.sku, name: article.name, article_type: article.article_type, base_dims_json: article.dims, grain_direction: GrainDir.none },
    })

    for (const option of article.options) {
      await prisma.articleOption.upsert({
        where: { id: option.id },
        update: { article_id: saved.id, option_key: option.key, option_type: 'enum', constraints_json: { values: option.values } },
        create: { id: option.id, article_id: saved.id, option_key: option.key, option_type: 'enum', constraints_json: { values: option.values } },
      })
    }
    for (const variant of article.variants) {
      await prisma.articleVariant.upsert({
        where: { id: variant.id },
        update: { article_id: saved.id, variant_key: variant.key, variant_values_json: variant.values },
        create: { id: variant.id, article_id: saved.id, variant_key: variant.key, variant_values_json: variant.values },
      })
    }
    await prisma.articlePrice.upsert({
      where: { id: article.id.replace(/^12/, '15') },
      update: { article_id: saved.id, price_list_id: PRICE_LIST_ID, valid_from: new Date('2026-01-01T00:00:00.000Z'), list_net: article.list_net, dealer_net: article.dealer_net, tax_group_id: TAX_GROUP_ID },
      create: { id: article.id.replace(/^12/, '15'), article_id: saved.id, price_list_id: PRICE_LIST_ID, valid_from: new Date('2026-01-01T00:00:00.000Z'), list_net: article.list_net, dealer_net: article.dealer_net, tax_group_id: TAX_GROUP_ID },
    })
  }

  console.log(`Starterkatalog bereit: ${legacyItems.length} Standardartikel, ${articles.length} Herstellerartikel.`)
}

seed()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
