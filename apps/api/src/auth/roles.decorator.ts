import { SetMetadata } from "@nestjs/common";

import { StaffRole } from "@prisma/client";

export const MIN_ROLE_KEY = "minRole";

/** Allows this role and every role above it (see ./roles.ts). */
export const MinRole = (role: StaffRole) => SetMetadata(MIN_ROLE_KEY, role);
