import { z } from "zod";

export const CreateInvoiceLineSchema = z.object({
  enrollmentId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  description: z.string(),
  amount: z.number().min(0),
  // Swim team season fees hang off the registration, not a single slot
  swimTeamRegistrationId: z.string().optional(),
  feeType: z.enum(["swim_team_practice", "swim_team_meet"]).optional(),
});

export const InvoiceInstallmentSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  amount: z.number().positive(),
});

// A plan is either pay in full (no installments) or exactly four installments
export const INSTALLMENT_COUNT = 4;

const InstallmentPlanSchema = z
  .array(InvoiceInstallmentSchema)
  .refine((list) => list.length === 0 || list.length === INSTALLMENT_COUNT, {
    message: `Choose pay in full or ${INSTALLMENT_COUNT} installments`,
  });

export const UpdateInstallmentsSchema = z.object({
  // An empty list clears the plan: the invoice is then due in full
  installments: InstallmentPlanSchema,
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  guardianId: z.string().optional(),
  totalAmount: z.number().min(0),
  locationId: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(CreateInvoiceLineSchema),
  createdAt: z.string().optional(),
  installments: InstallmentPlanSchema.optional(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
export type CreateInvoiceLineItemDto = z.infer<typeof CreateInvoiceLineSchema>;
export type InvoiceInstallmentDto = z.infer<typeof InvoiceInstallmentSchema>;
export type UpdateInstallmentsDto = z.infer<typeof UpdateInstallmentsSchema>;
