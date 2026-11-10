-- CreateEnum
CREATE TYPE "ReportCardSendStatus" AS ENUM ('pending', 'sent', 'failed', 'bounced', 'delivered');

-- AlterTable
ALTER TABLE "report_cards" ADD COLUMN     "communicationLogId" TEXT,
ADD COLUMN     "lastSendAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastSendError" TEXT,
ADD COLUMN     "lastSendStatus" "ReportCardSendStatus",
ADD COLUMN     "sendAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "report_cards_lastSendStatus_idx" ON "report_cards"("lastSendStatus");

-- CreateIndex
CREATE INDEX "report_cards_communicationLogId_idx" ON "report_cards"("communicationLogId");

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

