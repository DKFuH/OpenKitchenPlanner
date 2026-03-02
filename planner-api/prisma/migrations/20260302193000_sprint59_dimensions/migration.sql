-- CreateEnum
CREATE TYPE "DimensionType" AS ENUM ('linear', 'angular');

-- CreateTable
CREATE TABLE "dimensions" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "type" "DimensionType" NOT NULL,
    "points" JSONB NOT NULL,
    "style" JSONB NOT NULL DEFAULT '{}',
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dimensions_room_id_idx" ON "dimensions"("room_id");

-- AddForeignKey
ALTER TABLE "dimensions" ADD CONSTRAINT "dimensions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;