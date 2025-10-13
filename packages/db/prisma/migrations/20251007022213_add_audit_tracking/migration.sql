/*
  Warnings:

  - The values [dropped,waitlisted] on the enum `EnrollmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `Attendance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transferredToId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transferredFromId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `markedBy` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MakeUpStatus" AS ENUM ('requested', 'scheduled', 'attended', 'cancelled', 'missed');

-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('admin', 'manager', 'supervisor', 'viewer');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EnrollmentStatus_new" AS ENUM ('active', 'inactive', 'transferred');
ALTER TABLE "public"."Enrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Enrollment" ALTER COLUMN "status" TYPE "public"."EnrollmentStatus_new" USING ("status"::text::"public"."EnrollmentStatus_new");
ALTER TYPE "public"."EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "public"."EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "public"."EnrollmentStatus_old";
ALTER TABLE "public"."Enrollment" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "createdAt",
ADD COLUMN     "markedBy" TEXT NOT NULL,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."Enrollment" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "transferNotes" TEXT,
ADD COLUMN     "transferredAt" TIMESTAMP(3),
ADD COLUMN     "transferredBy" TEXT,
ADD COLUMN     "transferredFromId" TEXT,
ADD COLUMN     "transferredToId" TEXT;

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- CreateTable
CREATE TABLE "public"."StaffUser" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnrollmentSkip" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentSkip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MakeUpBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "status" "public"."MakeUpStatus" NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MakeUpBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_authId_key" ON "public"."StaffUser"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "public"."StaffUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_staffId_idx" ON "public"."AuditLog"("staffId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "EnrollmentSkip_classSessionId_idx" ON "public"."EnrollmentSkip"("classSessionId");

-- CreateIndex
CREATE INDEX "EnrollmentSkip_createdBy_idx" ON "public"."EnrollmentSkip"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSkip_enrollmentId_classSessionId_key" ON "public"."EnrollmentSkip"("enrollmentId", "classSessionId");

-- CreateIndex
CREATE INDEX "MakeUpBooking_classSessionId_idx" ON "public"."MakeUpBooking"("classSessionId");

-- CreateIndex
CREATE INDEX "MakeUpBooking_createdBy_idx" ON "public"."MakeUpBooking"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpBooking_studentId_classSessionId_key" ON "public"."MakeUpBooking"("studentId", "classSessionId");

-- CreateIndex
CREATE INDEX "Attendance_markedBy_idx" ON "public"."Attendance"("markedBy");

-- CreateIndex
CREATE INDEX "ClassSession_offeringId_date_idx" ON "public"."ClassSession"("offeringId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_transferredToId_key" ON "public"."Enrollment"("transferredToId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_transferredFromId_key" ON "public"."Enrollment"("transferredFromId");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_enrollDate_idx" ON "public"."Enrollment"("offeringId", "enrollDate");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_endDate_idx" ON "public"."Enrollment"("offeringId", "endDate");

-- CreateIndex
CREATE INDEX "Enrollment_createdBy_idx" ON "public"."Enrollment"("createdBy");

-- CreateIndex
CREATE INDEX "Enrollment_transferredBy_idx" ON "public"."Enrollment"("transferredBy");

-- CreateIndex
CREATE INDEX "Student_createdBy_idx" ON "public"."Student"("createdBy");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_transferredToId_fkey" FOREIGN KEY ("transferredToId") REFERENCES "public"."Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_transferredBy_fkey" FOREIGN KEY ("transferredBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "public"."ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "public"."ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
