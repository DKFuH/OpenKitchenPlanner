-- Sprint 90: CAD-Gruppen, Bauteile & Auswahlsets
CREATE TABLE "drawing_groups" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "name" VARCHAR(140) NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "members_json" JSONB NOT NULL,
  "config_json" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "drawing_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drawing_groups_tenant_id_project_id_kind_idx"
  ON "drawing_groups"("tenant_id", "project_id", "kind");
