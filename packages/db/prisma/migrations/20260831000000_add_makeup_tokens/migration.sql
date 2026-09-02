-- CreateEnum
CREATE TYPE "public"."TokenStatus" AS ENUM ('available', 'consumed', 'voided');

-- AlterTable
ALTER TABLE "public"."MakeUpBooking" ADD COLUMN "tokenId" TEXT,
ADD COLUMN "isOverride" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."makeup_tokens" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "public"."TokenStatus" NOT NULL DEFAULT 'available',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "makeup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpBooking_tokenId_key" ON "public"."MakeUpBooking"("tokenId");

-- CreateIndex
CREATE INDEX "makeup_tokens_enrollmentId_status_idx" ON "public"."makeup_tokens"("enrollmentId", "status");

-- AddForeignKey
ALTER TABLE "public"."MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "public"."makeup_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."makeup_tokens" ADD CONSTRAINT "makeup_tokens_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."makeup_tokens" ADD CONSTRAINT "makeup_tokens_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
