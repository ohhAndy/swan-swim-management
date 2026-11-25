-- Removes the unused viewer and instructor staff roles.
-- Fails and rolls back if any StaffUser still has one of them.

-- AlterEnum
BEGIN;
CREATE TYPE "StaffRole_new" AS ENUM ('admin', 'manager', 'supervisor', 'super_admin');
ALTER TABLE "StaffUser" ALTER COLUMN "role" TYPE "StaffRole_new" USING ("role"::text::"StaffRole_new");
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";
DROP TYPE "StaffRole_old";
COMMIT;

