-- Sprint 60: Katalog-Hierarchie, Kitchen Assistant & Schnellfilter

ALTER TABLE "catalog_articles"
  ADD COLUMN IF NOT EXISTS "family" TEXT,
  ADD COLUMN IF NOT EXISTS "collection" TEXT,
  ADD COLUMN IF NOT EXISTS "style_tag" TEXT,
  ADD COLUMN IF NOT EXISTS "is_favorite" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "usage_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_catalog_articles_family" ON "catalog_articles"("family");
CREATE INDEX IF NOT EXISTS "idx_catalog_articles_collection" ON "catalog_articles"("collection");
CREATE INDEX IF NOT EXISTS "idx_catalog_articles_tenant_fav" ON "catalog_articles"("tenant_id", "is_favorite");

CREATE TYPE "KitchenLayout" AS ENUM ('einzeiler', 'zweizeiler', 'l_form', 'u_form', 'insel');

CREATE TABLE "catalog_macros" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "positions" JSONB NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "catalog_macros_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_macros_tenant_id_idx" ON "catalog_macros"("tenant_id");

CREATE TABLE "kitchen_layout_suggestions" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "room_id" TEXT NOT NULL,
  "layout_type" "KitchenLayout" NOT NULL,
  "positions" JSONB NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "applied" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kitchen_layout_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kitchen_layout_suggestions_project_id_idx" ON "kitchen_layout_suggestions"("project_id");
CREATE INDEX "kitchen_layout_suggestions_room_id_idx" ON "kitchen_layout_suggestions"("room_id");
