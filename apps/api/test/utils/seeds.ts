import { PrismaService } from "../../src/prisma/prisma.service";

export async function seedAdmin(prisma: PrismaService, authId = "test-admin", email = "admin@test.com") {
  return prisma.staffUser.create({
    data: {
      authId,
      email,
      role: "admin",
      fullName: "Test Admin",
      active: true,
    },
  });
}

export async function seedSuperAdmin(prisma: PrismaService, authId = "test-superadmin", email = "superadmin@test.com") {
  return prisma.staffUser.create({
    data: {
      authId,
      email,
      role: "super_admin",
      fullName: "Test Super Admin",
      active: true,
    },
  });
}

export async function seedTerm(prisma: PrismaService, name = "Test Term", startDate = new Date(), endDate = new Date(Date.now() + 86400000 * 30)) {
  return prisma.term.create({
    data: {
      name,
      startDate,
      endDate,
    },
  });
}

export async function seedGuardian(prisma: PrismaService, fullName = "Test Guardian", email = "guardian@test.com") {
  return prisma.guardian.create({
    data: {
      fullName,
      email,
      phone: "555-123-4567",
      shortCode: "TESTG1",
    },
  });
}

export async function seedInstructor(prisma: PrismaService, firstName = "Test", lastName = "Instructor") {
  return prisma.instructor.create({
    data: {
      firstName,
      lastName,
      email: "instructor@test.com",
      isActive: true,
    },
  });
}

export async function seedClassOffering(prisma: PrismaService, termId: string, title = "Test Class") {
  return prisma.classOffering.create({
    data: {
      termId,
      title,
      capacity: 10,
      type: "regular",
      weekday: 1,
      startTime: "09:00",
      endTime: "10:00",
    },
  });
}
