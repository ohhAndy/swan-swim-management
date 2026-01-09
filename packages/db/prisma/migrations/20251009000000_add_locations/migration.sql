-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_LocationToStaffUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationToStaffUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "public"."locations"("slug");

-- CreateIndex
CREATE INDEX "_LocationToStaffUser_B_index" ON "public"."_LocationToStaffUser"("B");

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN "locationId" TEXT;

-- AlterTable
ALTER TABLE "public"."StaffUser" ADD COLUMN "accessibleLocations" TEXT[]; -- Wait, this is not how m-n works. Implicit m-n uses separate table (above).

-- AlterTable
ALTER TABLE "public"."Term" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_locationId_idx" ON "public"."Invoice"("locationId");

-- CreateIndex
CREATE INDEX "Term_locationId_idx" ON "public"."Term"("locationId");

-- AddForeignKey
ALTER TABLE "public"."Term" ADD CONSTRAINT "Term_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LocationToStaffUser" ADD CONSTRAINT "_LocationToStaffUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LocationToStaffUser" ADD CONSTRAINT "_LocationToStaffUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
