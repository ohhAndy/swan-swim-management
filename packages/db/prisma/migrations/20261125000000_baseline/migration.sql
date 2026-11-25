-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'inactive', 'transferred');

-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('regular', 'flexible', 'swim_team');

-- CreateEnum
CREATE TYPE "TermType" AS ENUM ('regular', 'swim_team_season');

-- CreateEnum
CREATE TYPE "LineItemFeeType" AS ENUM ('swim_team_practice', 'swim_team_meet');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'canceled', 'completed');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'excused');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('paid', 'partial', 'void', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'debit', 'visa', 'mastercard', 'etransfer', 'website', 'other');

-- CreateEnum
CREATE TYPE "MakeUpStatus" AS ENUM ('requested', 'scheduled', 'attended', 'cancelled', 'missed');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('available', 'consumed', 'voided');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('admin', 'manager', 'supervisor', 'viewer', 'instructor', 'super_admin');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('scheduled', 'attended', 'noshow', 'converted', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TrialRequestStatus" AS ENUM ('pending', 'approved', 'declined', 'spam');

-- CreateEnum
CREATE TYPE "ReportCardSendStatus" AS ENUM ('pending', 'sent', 'failed', 'bounced', 'delivered');

-- CreateEnum
CREATE TYPE "ReportCardStatus" AS ENUM ('draft', 'completed', 'did_not_pass', 'sent');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('not_started', 'developing', 'mastered');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('sent', 'partial', 'failed', 'delivered', 'queued', 'sending');

-- CreateEnum
CREATE TYPE "CommunicationRecipientStatus" AS ENUM ('queued', 'sent', 'failed', 'delivered', 'bounced');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_bookings" (
    "id" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedBy" TEXT,
    "convertedToStudentId" TEXT,
    "classRatio" TEXT NOT NULL DEFAULT '3:1',

    CONSTRAINT "trial_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessSchedule" JSONB,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
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
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" "TermType" NOT NULL DEFAULT 'regular',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "locationId" TEXT,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassOffering" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "type" "OfferingType" NOT NULL DEFAULT 'regular',
    "weekday" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "title" TEXT NOT NULL,
    "duration" INTEGER,
    "capacity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "enrollDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "endDate" DATE,
    "transferNotes" TEXT,
    "transferredAt" TIMESTAMP(3),
    "transferredBy" TEXT,
    "transferredFromId" TEXT,
    "transferredToId" TEXT,
    "classRatio" TEXT NOT NULL DEFAULT '3:1',
    "reportCardStatus" TEXT DEFAULT 'not_created',
    "swimTeamRegistrationId" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentSkip" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentSkip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "markedBy" TEXT,
    "updatedBy" TEXT,
    "acknowledgedOverdue" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "guardianId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "level" TEXT,
    "levelId" TEXT,
    "updatedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "waiverSigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "guardianId" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "locationId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "inventoryItemId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "swimTeamRegistrationId" TEXT,
    "feeType" "LineItemFeeType",

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MakeUpBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "status" "MakeUpStatus" NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classRatio" TEXT NOT NULL DEFAULT '3:1',
    "tokenId" TEXT,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MakeUpBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "makeup_tokens" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'available',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "makeup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_instructors" (
    "id" TEXT NOT NULL,
    "classOfferingId" TEXT NOT NULL,
    "staffUserId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "class_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gender" TEXT,
    "languages" TEXT[],
    "certificates" JSONB[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_requests" (
    "id" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "childName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "preferredDates" JSONB NOT NULL,
    "notes" TEXT,
    "status" "TrialRequestStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "ipAddress" TEXT,
    "cookieId" TEXT,
    "locationId" TEXT,

    CONSTRAINT "trial_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "color" TEXT DEFAULT '#3b82f6',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "levelId" TEXT,
    "status" "ReportCardStatus" NOT NULL DEFAULT 'draft',
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "sentById" TEXT,
    "lastSendStatus" "ReportCardSendStatus",
    "lastSendError" TEXT,
    "lastSendAttemptAt" TIMESTAMP(3),
    "sendAttempts" INTEGER NOT NULL DEFAULT 0,
    "communicationLogId" TEXT,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_card_skills" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "status" "SkillStatus" NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_card_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'sent',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_recipients" (
    "id" TEXT NOT NULL,
    "communicationLogId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "CommunicationRecipientStatus" NOT NULL DEFAULT 'queued',
    "resendId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" TEXT NOT NULL,
    "communicationLogId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "_LocationToStaffUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationToStaffUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- CreateIndex
CREATE INDEX "trial_bookings_classSessionId_idx" ON "trial_bookings"("classSessionId");

-- CreateIndex
CREATE INDEX "trial_bookings_status_idx" ON "trial_bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_authId_key" ON "StaffUser"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_staffId_idx" ON "AuditLog"("staffId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Term_slug_key" ON "Term"("slug");

-- CreateIndex
CREATE INDEX "Term_locationId_idx" ON "Term"("locationId");

-- CreateIndex
CREATE INDEX "ClassOffering_termId_idx" ON "ClassOffering"("termId");

-- CreateIndex
CREATE INDEX "ClassOffering_termId_weekday_startTime_idx" ON "ClassOffering"("termId", "weekday", "startTime");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_offeringId_date_key" ON "ClassSession"("offeringId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_transferredFromId_key" ON "Enrollment"("transferredFromId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_transferredToId_key" ON "Enrollment"("transferredToId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_enrollDate_idx" ON "Enrollment"("offeringId", "enrollDate");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_endDate_idx" ON "Enrollment"("offeringId", "endDate");

-- CreateIndex
CREATE INDEX "Enrollment_createdBy_idx" ON "Enrollment"("createdBy");

-- CreateIndex
CREATE INDEX "Enrollment_transferredBy_idx" ON "Enrollment"("transferredBy");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_status_idx" ON "Enrollment"("offeringId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_swimTeamRegistrationId_idx" ON "Enrollment"("swimTeamRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_offeringId_studentId_key" ON "Enrollment"("offeringId", "studentId");

-- CreateIndex
CREATE INDEX "EnrollmentSkip_classSessionId_idx" ON "EnrollmentSkip"("classSessionId");

-- CreateIndex
CREATE INDEX "EnrollmentSkip_createdBy_idx" ON "EnrollmentSkip"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSkip_enrollmentId_classSessionId_key" ON "EnrollmentSkip"("enrollmentId", "classSessionId");

-- CreateIndex
CREATE INDEX "Attendance_classSessionId_idx" ON "Attendance"("classSessionId");

-- CreateIndex
CREATE INDEX "Attendance_markedBy_idx" ON "Attendance"("markedBy");

-- CreateIndex
CREATE INDEX "Attendance_classSessionId_status_idx" ON "Attendance"("classSessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_enrollmentId_classSessionId_key" ON "Attendance"("enrollmentId", "classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_shortCode_key" ON "Student"("shortCode");

-- CreateIndex
CREATE INDEX "Student_guardianId_idx" ON "Student"("guardianId");

-- CreateIndex
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Student_createdBy_idx" ON "Student"("createdBy");

-- CreateIndex
CREATE INDEX "Student_level_idx" ON "Student"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_shortCode_key" ON "Guardian"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_fullName_idx" ON "Guardian"("fullName");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_createdBy_idx" ON "Guardian"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_guardianId_idx" ON "Invoice"("guardianId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_locationId_idx" ON "Invoice"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLineItem_enrollmentId_key" ON "InvoiceLineItem"("enrollmentId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_enrollmentId_idx" ON "InvoiceLineItem"("enrollmentId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_inventoryItemId_idx" ON "InvoiceLineItem"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_swimTeamRegistrationId_idx" ON "InvoiceLineItem"("swimTeamRegistrationId");

-- CreateIndex
CREATE INDEX "InvoiceInstallment_invoiceId_dueDate_idx" ON "InvoiceInstallment"("invoiceId", "dueDate");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpBooking_tokenId_key" ON "MakeUpBooking"("tokenId");

-- CreateIndex
CREATE INDEX "MakeUpBooking_classSessionId_idx" ON "MakeUpBooking"("classSessionId");

-- CreateIndex
CREATE INDEX "MakeUpBooking_createdBy_idx" ON "MakeUpBooking"("createdBy");

-- CreateIndex
CREATE INDEX "MakeUpBooking_classSessionId_status_idx" ON "MakeUpBooking"("classSessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MakeUpBooking_studentId_classSessionId_key" ON "MakeUpBooking"("studentId", "classSessionId");

-- CreateIndex
CREATE INDEX "makeup_tokens_enrollmentId_status_idx" ON "makeup_tokens"("enrollmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "class_instructors_classOfferingId_idx" ON "class_instructors"("classOfferingId");

-- CreateIndex
CREATE INDEX "class_instructors_instructorId_idx" ON "class_instructors"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "class_instructors_classOfferingId_instructorId_removedAt_key" ON "class_instructors"("classOfferingId", "instructorId", "removedAt");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "trial_requests_parentPhone_idx" ON "trial_requests"("parentPhone");

-- CreateIndex
CREATE INDEX "trial_requests_status_idx" ON "trial_requests"("status");

-- CreateIndex
CREATE INDEX "trial_requests_submittedAt_idx" ON "trial_requests"("submittedAt");

-- CreateIndex
CREATE INDEX "trial_requests_locationId_idx" ON "trial_requests"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "levels_name_key" ON "levels"("name");

-- CreateIndex
CREATE INDEX "skills_levelId_idx" ON "skills"("levelId");

-- CreateIndex
CREATE INDEX "report_cards_enrollmentId_idx" ON "report_cards"("enrollmentId");

-- CreateIndex
CREATE INDEX "report_cards_levelId_idx" ON "report_cards"("levelId");

-- CreateIndex
CREATE INDEX "report_cards_lastSendStatus_idx" ON "report_cards"("lastSendStatus");

-- CreateIndex
CREATE INDEX "report_cards_communicationLogId_idx" ON "report_cards"("communicationLogId");

-- CreateIndex
CREATE INDEX "report_card_skills_reportCardId_idx" ON "report_card_skills"("reportCardId");

-- CreateIndex
CREATE INDEX "report_card_skills_skillId_idx" ON "report_card_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "report_card_skills_reportCardId_skillId_key" ON "report_card_skills"("reportCardId", "skillId");

-- CreateIndex
CREATE INDEX "communication_logs_staffId_idx" ON "communication_logs"("staffId");

-- CreateIndex
CREATE INDEX "communication_logs_status_idx" ON "communication_logs"("status");

-- CreateIndex
CREATE INDEX "communication_logs_createdAt_idx" ON "communication_logs"("createdAt");

-- CreateIndex
CREATE INDEX "communication_recipients_communicationLogId_status_idx" ON "communication_recipients"("communicationLogId", "status");

-- CreateIndex
CREATE INDEX "communication_recipients_resendId_idx" ON "communication_recipients"("resendId");

-- CreateIndex
CREATE INDEX "communication_attachments_communicationLogId_idx" ON "communication_attachments"("communicationLogId");

-- CreateIndex
CREATE UNIQUE INDEX "SwimTeamFeeTier_termId_frequency_key" ON "SwimTeamFeeTier"("termId", "frequency");

-- CreateIndex
CREATE INDEX "SwimTeamRegistration_termId_status_idx" ON "SwimTeamRegistration"("termId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SwimTeamRegistration_studentId_termId_key" ON "SwimTeamRegistration"("studentId", "termId");

-- CreateIndex
CREATE INDEX "_LocationToStaffUser_B_index" ON "_LocationToStaffUser"("B");

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_convertedBy_fkey" FOREIGN KEY ("convertedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_convertedToStudentId_fkey" FOREIGN KEY ("convertedToStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_bookings" ADD CONSTRAINT "trial_bookings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassOffering" ADD CONSTRAINT "ClassOffering_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ClassOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_swimTeamRegistrationId_fkey" FOREIGN KEY ("swimTeamRegistrationId") REFERENCES "SwimTeamRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ClassOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_transferredBy_fkey" FOREIGN KEY ("transferredBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_transferredToId_fkey" FOREIGN KEY ("transferredToId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSkip" ADD CONSTRAINT "EnrollmentSkip_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_swimTeamRegistrationId_fkey" FOREIGN KEY ("swimTeamRegistrationId") REFERENCES "SwimTeamRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceInstallment" ADD CONSTRAINT "InvoiceInstallment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MakeUpBooking" ADD CONSTRAINT "MakeUpBooking_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "makeup_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeup_tokens" ADD CONSTRAINT "makeup_tokens_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeup_tokens" ADD CONSTRAINT "makeup_tokens_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructors" ADD CONSTRAINT "class_instructors_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructors" ADD CONSTRAINT "class_instructors_classOfferingId_fkey" FOREIGN KEY ("classOfferingId") REFERENCES "ClassOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructors" ADD CONSTRAINT "class_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructors" ADD CONSTRAINT "class_instructors_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instructors" ADD CONSTRAINT "class_instructors_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_requests" ADD CONSTRAINT "trial_requests_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_skills" ADD CONSTRAINT "report_card_skills_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_skills" ADD CONSTRAINT "report_card_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamFeeTier" ADD CONSTRAINT "SwimTeamFeeTier_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwimTeamRegistration" ADD CONSTRAINT "SwimTeamRegistration_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationToStaffUser" ADD CONSTRAINT "_LocationToStaffUser_A_fkey" FOREIGN KEY ("A") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationToStaffUser" ADD CONSTRAINT "_LocationToStaffUser_B_fkey" FOREIGN KEY ("B") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
