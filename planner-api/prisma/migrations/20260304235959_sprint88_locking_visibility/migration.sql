-- Sprint 88: locking, visibility and safe-edit flags
ALTER TABLE "building_levels" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "building_levels" ADD COLUMN "lock_scope" VARCHAR(30);

ALTER TABLE "dimensions" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "dimensions" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dimensions" ADD COLUMN "lock_scope" VARCHAR(30);