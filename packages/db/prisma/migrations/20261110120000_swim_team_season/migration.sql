-- CreateEnum
CREATE TYPE "TermType" AS ENUM ('regular', 'swim_team_season');

-- CreateEnum
CREATE TYPE "LineItemFeeType" AS ENUM ('swim_team_practice', 'swim_team_meet');

-- AlterEnum
ALTER TYPE "OfferingType" ADD VALUE 'swim_team';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "acknowledgedOverdue" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "swimTeamRegistrationId" TEXT;

-- AlterTable
ALTER TABLE "InvoiceLineItem" ADD COLUMN     "feeType" "LineItemFeeType",
ADD COLUMN     "swimTeamRegistrationId" TEXT;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "type" "TermType" NOT NULL DEFAULT 'regular';

-- CreateTable
CREATE TABLE "InvoiceInstallment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwimTeamFeeTier" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "practiceFee" DECIMAL(10,2) NOT NULL,
    "meetFee" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwimTeamFeeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwimTeamRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "competing" BOOLEAN NOT NULL DEFAULT false,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SwimTeamRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceInstallment_invoiceId_dueDate_idx" ON "InvoiceInstallment"("invoiceId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SwimTeamFeeTier_termId_frequency_key" ON "SwimTeamFeeTier"("termId", "frequency");

-- CreateIndex
CREATE INDEX "SwimTeamRegistration_termId_status_idx" ON "SwimTeamRegistration"("termId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SwimTeamRegistration_studentId_termId_key" ON "SwimTeamRegistration"("studentId", "termId");

-- CreateIndex
CREATE INDEX "Enrollment_swimTeamRegistrationId_idx" ON "Enrollment"("swimTeamRegistrationId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_swimTeamRegistrationId_idx" ON "InvoiceLineItem"("swimTeamRegistrationId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_swimTeamRegistrationId_fkey" FOREIGN KEY ("swimTeamRegistrationId") REFERENCES "SwimTeamRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_swimTeamRegistrationId_fkey" FOREIGN KEY ("swimTeamRegistrationId") REFERENCES "SwimTeamRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceInstallment" ADD CONSTRAINT "InvoiceInstallment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamFeeTier" ADD CONSTRAINT "SwimTeamFeeTier_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

