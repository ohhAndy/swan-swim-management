-- invoiceNumber is already @unique, which creates its own index.
DROP INDEX IF EXISTS "public"."Invoice_invoiceNumber_idx";
