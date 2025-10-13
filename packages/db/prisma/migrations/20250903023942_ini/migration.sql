-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('active', 'dropped', 'waitlisted');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('scheduled', 'canceled', 'completed');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('present', 'absent', 'excused');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'void', 'canceled');

-- CreateTable
CREATE TABLE "public"."Term" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassOffering" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassSession" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'active',
    "enrollDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "guardianId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Guardian" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "irlId" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_slug_key" ON "public"."Term"("slug");

-- CreateIndex
CREATE INDEX "ClassOffering_termId_idx" ON "public"."ClassOffering"("termId");

-- CreateIndex
CREATE INDEX "ClassOffering_termId_weekday_startTime_idx" ON "public"."ClassOffering"("termId", "weekday", "startTime");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "public"."ClassSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_offeringId_date_key" ON "public"."ClassSession"("offeringId", "date");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "public"."Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_offeringId_idx" ON "public"."Enrollment"("offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_offeringId_studentId_key" ON "public"."Enrollment"("offeringId", "studentId");

-- CreateIndex
CREATE INDEX "Attendance_classSessionId_idx" ON "public"."Attendance"("classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_enrollmentId_classSessionId_key" ON "public"."Attendance"("enrollmentId", "classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_shortCode_key" ON "public"."Student"("shortCode");

-- CreateIndex
CREATE INDEX "Student_guardianId_idx" ON "public"."Student"("guardianId");

-- CreateIndex
CREATE INDEX "Student_lastName_firstName_idx" ON "public"."Student"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_shortCode_key" ON "public"."Guardian"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "public"."Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_fullName_idx" ON "public"."Guardian"("fullName");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "public"."Guardian"("email");

-- AddForeignKey
ALTER TABLE "public"."ClassOffering" ADD CONSTRAINT "ClassOffering_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSession" ADD CONSTRAINT "ClassSession_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "public"."ClassOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "public"."ClassOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "public"."ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "public"."Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "public"."Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
