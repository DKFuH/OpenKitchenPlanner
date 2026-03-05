-- Sprint 103: ERP Integration Hooks (DATEV and third-party systems)

CREATE TYPE "IntegrationDeliveryStatus" AS ENUM ('pending', 'processing', 'delivered', 'failed', 'dead_letter');

CREATE TABLE "integration_endpoints" (
    "id"                   TEXT NOT NULL,
    "tenant_id"            TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "provider"             TEXT NOT NULL,
    "endpoint_url"         TEXT NOT NULL,
    "auth_mode"            TEXT NOT NULL DEFAULT 'none',
    "auth_config"          JSONB NOT NULL DEFAULT '{}',
    "mapping_profile_json" JSONB NOT NULL DEFAULT '{}',
    "dry_run"              BOOLEAN NOT NULL DEFAULT false,
    "is_active"            BOOLEAN NOT NULL DEFAULT true,
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_mapping_profiles" (
    "id"          TEXT NOT NULL,
    "tenant_id"   TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "config_json" JSONB NOT NULL DEFAULT '{}',
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_mapping_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_outbox_messages" (
    "id"              TEXT NOT NULL,
    "tenant_id"       TEXT NOT NULL,
    "endpoint_id"     TEXT NOT NULL,
    "event_type"      TEXT NOT NULL,
    "payload_json"    JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status"          "IntegrationDeliveryStatus" NOT NULL DEFAULT 'pending',
    "last_error"      TEXT,
    "next_retry_at"   TIMESTAMP(3),
    "delivered_at"    TIMESTAMP(3),
    "attempt_count"   INTEGER NOT NULL DEFAULT 0,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_outbox_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_delivery_attempts" (
    "id"                TEXT NOT NULL,
    "outbox_message_id" TEXT NOT NULL,
    "tenant_id"         TEXT NOT NULL,
    "attempt_no"        INTEGER NOT NULL,
    "http_status"       INTEGER,
    "error_code"        TEXT,
    "error_message"     TEXT,
    "response_json"     JSONB,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_delivery_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integration_endpoints_tenant_provider_is_active_idx"
    ON "integration_endpoints"("tenant_id", "provider", "is_active");

CREATE INDEX "integration_mapping_profiles_tenant_endpoint_is_active_idx"
    ON "integration_mapping_profiles"("tenant_id", "endpoint_id", "is_active");

CREATE UNIQUE INDEX "integration_outbox_messages_tenant_idempotency_key_key"
    ON "integration_outbox_messages"("tenant_id", "idempotency_key");

CREATE INDEX "integration_outbox_messages_tenant_status_created_at_idx"
    ON "integration_outbox_messages"("tenant_id", "status", "created_at");

CREATE INDEX "integration_outbox_messages_tenant_endpoint_idx"
    ON "integration_outbox_messages"("tenant_id", "endpoint_id");

CREATE INDEX "integration_delivery_attempts_tenant_outbox_attempt_idx"
    ON "integration_delivery_attempts"("tenant_id", "outbox_message_id", "attempt_no");

ALTER TABLE "integration_mapping_profiles"
    ADD CONSTRAINT "integration_mapping_profiles_endpoint_id_fkey"
    FOREIGN KEY ("endpoint_id") REFERENCES "integration_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "integration_outbox_messages"
    ADD CONSTRAINT "integration_outbox_messages_endpoint_id_fkey"
    FOREIGN KEY ("endpoint_id") REFERENCES "integration_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "integration_delivery_attempts"
    ADD CONSTRAINT "integration_delivery_attempts_outbox_message_id_fkey"
    FOREIGN KEY ("outbox_message_id") REFERENCES "integration_outbox_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
