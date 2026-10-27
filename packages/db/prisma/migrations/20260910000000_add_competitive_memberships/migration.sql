-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."MembershipStatus" AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."LineItemFeeType" AS ENUM ('TUITION', 'ANNUAL_REGISTRATION', 'MONTHLY_PRACTICE', 'CLASS_PASS', 'INVENTORY', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Attendance
ALTER TABLE "public"."Attendance" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "public"."Attendance" ADD COLUMN IF NOT EXISTS "membershipId" TEXT;
ALTER TABLE "public"."Attendance" ADD COLUMN IF NOT EXISTS "acknowledgedOverdue" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."Attendance" ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- Backfill existing Attendance records with studentId from Enrollment
UPDATE "public"."Attendance" a
SET "studentId" = e."studentId"
FROM "public"."Enrollment" e
WHERE a."enrollmentId" = e."id"
  AND a."studentId" IS NULL;

-- AlterTable InvoiceLineItem
ALTER TABLE "public"."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "membershipId" TEXT;
ALTER TABLE "public"."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "feeType" "public"."LineItemFeeType" NOT NULL DEFAULT 'TUITION';
ALTER TABLE "public"."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT;

-- CreateTable student_memberships
CREATE TABLE IF NOT EXISTS "public"."student_memberships" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seasonTermId" TEXT NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'active',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "annualRegFee" DECIMAL(10,2) NOT NULL,
    "monthlyPracticeFee" DECIMAL(10,2) NOT NULL,
    "annualRegPaid" BOOLEAN NOT NULL DEFAULT false,
    "allowedLocationIds" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "student_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_classSessionId_key" ON "public"."Attendance"("studentId", "classSessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "public"."Attendance"("studentId");
CREATE INDEX IF NOT EXISTS "Attendance_membershipId_idx" ON "public"."Attendance"("membershipId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_membershipId_idx" ON "public"."InvoiceLineItem"("membershipId");
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_billingPeriod_idx" ON "public"."InvoiceLineItem"("billingPeriod");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_memberships_studentId_idx" ON "public"."student_memberships"("studentId");
CREATE INDEX IF NOT EXISTS "student_memberships_seasonTermId_idx" ON "public"."student_memberships"("seasonTermId");
CREATE INDEX IF NOT EXISTS "student_memberships_status_idx" ON "public"."student_memberships"("status");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_studentId_fkey') THEN
    ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_membershipId_fkey') THEN
    ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."student_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceLineItem_membershipId_fkey') THEN
    ALTER TABLE "public"."InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."student_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_memberships_studentId_fkey') THEN
    ALTER TABLE "public"."student_memberships" ADD CONSTRAINT "student_memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_memberships_seasonTermId_fkey') THEN
    ALTER TABLE "public"."student_memberships" ADD CONSTRAINT "student_memberships_seasonTermId_fkey" FOREIGN KEY ("seasonTermId") REFERENCES "public"."Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_memberships_createdBy_fkey') THEN
    ALTER TABLE "public"."student_memberships" ADD CONSTRAINT "student_memberships_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
