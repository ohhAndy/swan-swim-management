import { z } from "zod";
import { createZodDto } from "nestjs-zod";

export const CreateMembershipSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  seasonTermId: z.string().min(1, "Season Term ID is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").optional(),
  annualRegFee: z.number().min(0, "Annual registration fee must be >= 0"),
  monthlyPracticeFee: z.number().min(0, "Monthly practice fee must be >= 0"),
  allowedLocationIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const UpdateMembershipSchema = z.object({
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  monthlyPracticeFee: z.number().min(0).optional(),
  annualRegFee: z.number().min(0).optional(),
  annualRegPaid: z.boolean().optional(),
  allowedLocationIds: z.array(z.string()).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export const UninvoicedMembershipsQuerySchema = z.object({
  guardianId: z.string().optional(),
  locationId: z.string().optional(),
  month: z.string().optional(), // specific month e.g. "2026-10", or omitted for all uninvoiced months
  fromMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  toMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export class CreateMembershipDto extends createZodDto(CreateMembershipSchema) {}
export class UpdateMembershipDto extends createZodDto(UpdateMembershipSchema) {}
export class UninvoicedMembershipsQueryDto extends createZodDto(UninvoicedMembershipsQuerySchema) {}
