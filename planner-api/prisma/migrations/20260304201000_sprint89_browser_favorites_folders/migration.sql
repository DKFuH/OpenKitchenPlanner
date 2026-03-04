-- Sprint 89: Browser-Favoriten, Ordner, Kollektionen und Saved Filters
ALTER TABLE "asset_library_items"
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "folder_id" TEXT,
  ADD COLUMN "collection" VARCHAR(120);

CREATE INDEX "asset_library_items_tenant_id_favorite_updated_at_idx"
  ON "asset_library_items"("tenant_id", "favorite", "updated_at");
CREATE INDEX "asset_library_items_tenant_id_folder_id_idx"
  ON "asset_library_items"("tenant_id", "folder_id");

CREATE TABLE "library_folders" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "parent_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "library_folders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "library_folders_tenant_id_kind_idx"
  ON "library_folders"("tenant_id", "kind");
CREATE INDEX "library_folders_tenant_id_parent_id_idx"
  ON "library_folders"("tenant_id", "parent_id");

CREATE TABLE "library_saved_filters" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "saved_filter_json" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "library_saved_filters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "library_saved_filters_tenant_id_kind_idx"
  ON "library_saved_filters"("tenant_id", "kind");

ALTER TABLE "material_library_items"
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "folder_id" TEXT,
  ADD COLUMN "collection" VARCHAR(120);

CREATE INDEX "material_library_items_tenant_id_favorite_updated_at_idx"
  ON "material_library_items"("tenant_id", "favorite", "updated_at");
CREATE INDEX "material_library_items_tenant_id_folder_id_idx"
  ON "material_library_items"("tenant_id", "folder_id");
