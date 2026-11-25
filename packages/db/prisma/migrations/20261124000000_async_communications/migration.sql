-- CreateEnum
CREATE TYPE "CommunicationRecipientStatus" AS ENUM ('queued', 'sent', 'failed', 'delivered', 'bounced');

-- AlterEnum (new values must not be used later in this transaction)
ALTER TYPE "CommunicationStatus" ADD VALUE 'queued';
ALTER TYPE "CommunicationStatus" ADD VALUE 'sending';

-- AlterTable
ALTER TABLE "communication_logs" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

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

-- CreateIndex
CREATE INDEX "communication_recipients_communicationLogId_status_idx" ON "communication_recipients"("communicationLogId", "status");

-- CreateIndex
CREATE INDEX "communication_recipients_resendId_idx" ON "communication_recipients"("resendId");

-- CreateIndex
CREATE INDEX "communication_attachments_communicationLogId_idx" ON "communication_attachments"("communicationLogId");

-- AddForeignKey
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "communication_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill recipient rows from the old JSON column before dropping it.
INSERT INTO "communication_recipients" (
    "id", "communicationLogId", "email", "status", "resendId", "error",
    "attempts", "createdAt", "updatedAt"
)
SELECT
    'cbf' || substr(md5(l."id" || ':' || r.ord::text), 1, 22),
    l."id",
    COALESCE(r.elem->>'email', ''),
    CASE r.elem->>'status'
        WHEN 'sent' THEN 'sent'::"CommunicationRecipientStatus"
        WHEN 'failed' THEN 'failed'::"CommunicationRecipientStatus"
        WHEN 'delivered' THEN 'delivered'::"CommunicationRecipientStatus"
        WHEN 'bounced' THEN 'bounced'::"CommunicationRecipientStatus"
        ELSE 'failed'::"CommunicationRecipientStatus"
    END,
    r.elem->>'resendId',
    r.elem->>'error',
    1,
    l."createdAt",
    l."updatedAt"
FROM "communication_logs" l
CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(l."recipients") = 'array' THEN l."recipients" ELSE '[]'::jsonb END
) WITH ORDINALITY AS r(elem, ord);

UPDATE "communication_logs" SET "completedAt" = "updatedAt";

-- AlterTable
ALTER TABLE "communication_logs" DROP COLUMN "recipients";
