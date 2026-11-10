/**
 * One-off backfill: upgrade students whose report card was emailed while still a
 * draft. Emailing jumped the card straight to "sent", skipping the "completed"
 * step that advances the student's level.
 *
 * Usage (from packages/db):
 *   npx tsx scripts/backfill-report-card-upgrades.ts --env .env.prod            # dry run
 *   npx tsx scripts/backfill-report-card-upgrades.ts --env .env.prod --apply --staff-id <id>
 *
 * Selection mirrors ReportCardsService.upgradeStudentLevel: target = level after
 * the highest affected card's level, only if it is above the student's current
 * level. Applying is atomic, guarded against concurrent level changes, and writes
 * an audit log per student. Did-not-pass cards are untouched.
 */
import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
  student_id: string;
  first_name: string;
  last_name: string;
  current_level_id: string | null;
  current_level: string | null;
  passed_level: string;
  target_level_id: string;
  target_level: string;
  report_card_ids: string;
}

const findAffected = () => prisma.$queryRaw<Row[]>`
  WITH prior AS (
    SELECT DISTINCT ON (a."entityId") a."entityId",
           COALESCE(a.changes->'status'->>'to', a.metadata->>'status') AS last_status
    FROM "AuditLog" a
    WHERE a."entityType" = 'ReportCard'
      AND a.action IN ('Create Report Card', 'Update Report Card')
    ORDER BY a."entityId", a."createdAt" DESC
  ), affected AS (
    SELECT e."studentId", MAX(l."order") AS card_order, string_agg(rc.id, ';') AS report_card_ids
    FROM report_cards rc
    JOIN levels l ON l.id = rc."levelId"
    JOIN "Enrollment" e ON e.id = rc."enrollmentId"
    JOIN "Student" s ON s.id = e."studentId"
    LEFT JOIN levels sl ON sl.id = s."levelId"
    JOIN prior p ON p."entityId" = rc.id
    WHERE rc.status = 'sent' AND p.last_status = 'draft'
      AND COALESCE(sl."order", -1) <= l."order"
    GROUP BY e."studentId"
  )
  SELECT s.id AS student_id, s."firstName" AS first_name, s."lastName" AS last_name,
         s."levelId" AS current_level_id, COALESCE(sl.name, s.level) AS current_level,
         cl.name AS passed_level, nl.id AS target_level_id, nl.name AS target_level,
         a.report_card_ids
  FROM affected a
  JOIN "Student" s ON s.id = a."studentId"
  LEFT JOIN levels sl ON sl.id = s."levelId"
  JOIN levels cl ON cl."order" = a.card_order
  JOIN LATERAL (
    SELECT id, name, "order" FROM levels WHERE "order" > a.card_order ORDER BY "order" LIMIT 1
  ) nl ON true
  WHERE nl."order" > COALESCE(sl."order", -1)
  ORDER BY s."lastName", s."firstName"`;

async function main() {
  const rows = await findAffected();
  console.log(`${rows.length} students to upgrade${apply ? "" : " (dry run)"}`);
  for (const r of rows) {
    console.log(
      `  ${r.first_name} ${r.last_name}: ${r.current_level ?? "(none)"} -> ${r.target_level} (card: ${r.passed_level})`,
    );
  }
  if (!apply) return;

  const staff = await prisma.staffUser.findUnique({ where: { id: staffId! } });
  if (!staff) throw new Error(`StaffUser ${staffId} not found`);

  let updated = 0;
  const skipped: string[] = [];
  await prisma.$transaction(
    async (tx) => {
      for (const r of rows) {
        // Guard: only update if the level hasn't changed since we read it.
        const res = await tx.student.updateMany({
          where: { id: r.student_id, levelId: r.current_level_id },
          data: { level: r.target_level, levelId: r.target_level_id },
        });
        if (res.count !== 1) {
          skipped.push(r.student_id);
          continue;
        }
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            action: "Backfill Level Upgrade",
            entityType: "Student",
            entityId: r.student_id,
            changes: { level: { from: r.current_level, to: r.target_level } },
            metadata: {
              reason: "Report card emailed as draft; upgrade on completion was skipped",
              reportCardIds: r.report_card_ids.split(";"),
              passedLevel: r.passed_level,
            },
          },
        });
        updated++;
      }
    },
    { timeout: 120_000 },
  );
  console.log(`Applied: ${updated} upgraded, ${skipped.length} skipped (level changed concurrently)`);
  if (skipped.length) console.log(`Skipped student ids: ${skipped.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
