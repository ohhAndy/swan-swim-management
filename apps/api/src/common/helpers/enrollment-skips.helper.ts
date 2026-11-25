import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { EnrollmentStatus } from "@prisma/client";
import { RequestStaffUser } from "../../auth/auth.types";

export function assertCanEditSkips(
  enrollmentStatus: EnrollmentStatus,
  staffUser: RequestStaffUser,
) {
  if (enrollmentStatus !== "active" && enrollmentStatus !== "inactive") {
    throw new BadRequestException(
      "Only active or inactive enrollments can have skips changed",
    );
  }

  const isAdmin = staffUser.role === "admin" || staffUser.role === "super_admin";
  if (enrollmentStatus === "inactive" && !isAdmin) {
    throw new ForbiddenException(
      "Only admins can modify skips for inactive enrollments",
    );
  }
}
