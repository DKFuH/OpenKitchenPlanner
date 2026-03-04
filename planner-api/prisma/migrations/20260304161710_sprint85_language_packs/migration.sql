-- CreateTable
CREATE TABLE "language_packs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "locale_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scope" VARCHAR(20) NOT NULL,
    "messages_json" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "language_packs_locale_code_enabled_idx" ON "language_packs"("locale_code", "enabled");

-- CreateIndex
CREATE INDEX "language_packs_tenant_id_locale_code_enabled_idx" ON "language_packs"("tenant_id", "locale_code", "enabled");
