import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const mainLocation = await prisma.location.upsert({
    where: { slug: "main" },
    update: {},
    create: {
      name: "Main Branch",
      slug: "main",
      address: "123 Swim Lane",
    },
  });

  console.log({ mainLocation });

  // Backfill logic
  // Update all terms without locationId
  const updatedTerms = await prisma.term.updateMany({
    where: { locationId: null },
    data: { locationId: mainLocation.id },
  });
  console.log(`Updated ${updatedTerms.count} terms`);

  // Update all invoices without locationId
  const updatedInvoices = await prisma.invoice.updateMany({
    where: { locationId: null },
    data: { locationId: mainLocation.id },
  });
  console.log(`Updated ${updatedInvoices.count} invoices`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
