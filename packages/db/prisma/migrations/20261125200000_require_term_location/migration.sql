-- Every term belongs to exactly one location; "global" terms are no longer supported.
-- Fails and rolls back if any Term still has no location. Assign one first:
--   UPDATE "Term" SET "locationId" = '<location id>' WHERE "locationId" IS NULL;

-- DropForeignKey
ALTER TABLE "Term" DROP CONSTRAINT "Term_locationId_fkey";

-- AlterTable
ALTER TABLE "Term" ALTER COLUMN "locationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
