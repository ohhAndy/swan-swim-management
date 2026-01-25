import { SetMetadata } from "@nestjs/common";

export type StaffRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "supervisor"
  | "viewer";

export const ROLES_KEY = "roles";
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);
