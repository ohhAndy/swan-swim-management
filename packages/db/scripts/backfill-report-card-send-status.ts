/**
 * One-off backfill: populate report_cards.lastSendStatus for cards sent before
 * send tracking existed. Emailing used to mark a card "sent" even when Resend
 * rejected the email, leaving it locked with no way to retry.
 *
 * Each sent card is matched to the CommunicationLog written by the same send
 * (same staff, guardian email in recipients, created up to 2 minutes before
 * sentAt). The card takes that recipient's status (sent / delivered / failed /
 * bounced) and is linked to the log so later webhook events update it. Cards
 * that are failed or bounced then show "Retry Email" in the portal.
 *
 * Usage (from packages/db):
 *   npx tsx scripts/backfill-report-card-send-status.ts --env .env.prod            # dry run
 *   npx tsx scripts/backfill-report-card-send-status.ts --env .env.prod --apply --staff-id <id>
 */
import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ReportCardSendStatus } from "@prisma/client";

const args = process.argv.slice(2);
const argValue = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const apply = args.includes("--apply");
const staffId = argValue("--staff-id");
config({ path: argValue("--env") ?? ".env" });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL / DATABASE_URL not set");
if (apply && !staffId) throw new Error("--apply requires --staff-id <StaffUser id>");

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: url })) });

interface Row {
  report_card_id: string;
  first_name: string;
  last_name: string;
  guardian_email: string;
  sent_at: Date;
  communication_log_id: string | null;
  recipient_status: string | null;
  recipient_error: string | null;
}

const SEND_STATUSES: Record<string, ReportCardSendStatus> = {
  sent: ReportCardSendStatus.sent,
  delivered: ReportCardSendStatus.delivered,
  failed: ReportCardSendStatus.failed,
  bounced: ReportCardSendStatus.bounced,
};

const findUntracked = () => prisma.$queryRaw<Row[]>`
  SELECT rc.id AS report_card_id, s."firstName" AS first_name, s."lastName" AS last_name,
         g.email AS guardian_email, rc."sentAt" AS sent_at,
         cl.id AS communication_log_id,
         cl.recipient->>'status' AS recipient_status,
         cl.recipient->>'error' AS recipient_error
  FROM report_cards rc
  JOIN "Enrollment" e ON e.id = rc."enrollmentId"
  JOIN "Student" s ON s.id = e."studentId"
  JOIN "Guardian" g ON g.id = s."guardianId"
  LEFT JOIN LATERAL (
    SELECT c.id, r.recipient
    FROM communication_logs c
    CROSS JOIN LATERAL jsonb_array_elements(c.recipients) AS r(recipient)
    WHERE c."staffId" IS NOT DISTINCT FROM rc."sentById"
      AND c.subject LIKE 'Progress Report for %'
      AND r.recipient->>'email' = g.email
      AND c."createdAt" BETWEEN rc."sentAt" - interval '2 minutes' AND rc."sentAt"
    ORDER BY c."createdAt" DESC
    LIMIT 1
  ) cl ON true
  WHERE rc.status = 'sent' AND rc."lastSendStatus" IS NULL AND rc."sentAt" IS NOT NULL
  ORDER BY rc."sentAt"`;

async function main() {
  const rows = await findUntracked();
  const matched = rows.filter((r) => r.recipient_status && SEND_STATUSES[r.recipient_status]);
  const unmatched = rows.filter((r) => !matched.includes(r));

  const counts: Record<string, number> = {};
  for (const r of matched) counts[r.recipient_status!] = (counts[r.recipient_status!] ?? 0) + 1;

  console.log(`${rows.length} sent report cards without send tracking${apply ? "" : " (dry run)"}`);
  console.log(`  matched to a communication log: ${matched.length} ${JSON.stringify(counts)}`);
  console.log(`  no matching log (left untouched): ${unmatched.length}`);
  for (const r of matched.filter((m) => m.recipient_status === "failed" || m.recipient_status === "bounced")) {
    console.log(
      `  ${r.recipient_status!.toUpperCase()}: ${r.first_name} ${r.last_name} <${r.guardian_email}> ` +
        `sent ${r.sent_at.toISOString()}${r.recipient_error ? ` — ${r.recipient_error}` : ""}`,
    );
  }
  if (!apply) return;

  const staff = await prisma.staffUser.findUnique({ where: { id: staffId! } });
  if (!staff) throw new Error(`StaffUser ${staffId} not found`);

  let updated = 0;
  await prisma.$transaction(
    async (tx) => {
      for (const r of matched) {
        const status = SEND_STATUSES[r.recipient_status!];
        // Guard: skip cards that were (re)sent with tracking since we read them.
        const res = await tx.reportCard.updateMany({
          where: { id: r.report_card_id, lastSendStatus: null },
          data: {
            lastSendStatus: status,
            lastSendError: status === "failed" || status === "bounced" ? r.recipient_error : null,
            lastSendAttemptAt: r.sent_at,
            sendAttempts: 1,
            communicationLogId: r.communication_log_id,
          },
        });
        if (res.count !== 1) continue;
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            action: "Backfill Report Card Send Status",
            entityType: "ReportCard",
            entityId: r.report_card_id,
            metadata: {
              lastSendStatus: status,
              communicationLogId: r.communication_log_id,
              reason: "Send status tracking added; derived from the matching communication log",
            },
          },
        });
        updated++;
      }
    },
    { timeout: 120_000 },
  );
  console.log(`Applied: ${updated} report cards updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
