import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@yoothwell.com" },
    update: {},
    create: {
      email: "admin@yoothwell.com",
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
      phone: "555-0100",
    },
  });

  const clinician = await prisma.user.upsert({
    where: { email: "clinician@yoothwell.com" },
    update: {},
    create: {
      email: "clinician@yoothwell.com",
      name: "Dr. Sarah Chen",
      passwordHash,
      role: Role.CLINICIAN,
      phone: "555-0101",
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@yoothwell.com" },
    update: {},
    create: {
      email: "patient@yoothwell.com",
      name: "Jane Doe",
      passwordHash,
      role: Role.PATIENT,
      phone: "555-0102",
      patientProfile: {
        create: {
          dateOfBirth: new Date("1985-06-15"),
          gender: "Female",
          address: "123 Wellness Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
          allergies: "Penicillin",
          medicalHistory: "General wellness optimization",
        },
      },
    },
    include: { patientProfile: true },
  });

  const patientProfile = patientUser.patientProfile!;
  const patient2 = await prisma.user.upsert({
    where: { email: "john@yoothwell.com" },
    update: {},
    create: {
      email: "john@yoothwell.com",
      name: "John Smith",
      passwordHash,
      role: Role.PATIENT,
      patientProfile: { create: {} },
    },
    include: { patientProfile: true },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "VIT-D3-5K" },
      update: {},
      create: {
        name: "Vitamin D3 5000 IU",
        description: "High-potency vitamin D3 for immune and bone health",
        sku: "VIT-D3-5K",
        price: 29.99,
        category: "Supplements",
      },
    }),
    prisma.product.upsert({
      where: { sku: "OMEGA-3-PRO" },
      update: {},
      create: {
        name: "Omega-3 Pro",
        description: "Premium fish oil with EPA/DHA",
        sku: "OMEGA-3-PRO",
        price: 39.99,
        category: "Supplements",
      },
    }),
    prisma.product.upsert({
      where: { sku: "GUT-RESTORE" },
      update: {},
      create: {
        name: "Gut Restore Protocol",
        description: "Comprehensive gut health support",
        sku: "GUT-RESTORE",
        price: 59.99,
        category: "Protocols",
      },
    }),
    prisma.product.upsert({
      where: { sku: "SLEEP-OPT" },
      update: {},
      create: {
        name: "Sleep Optimization",
        description: "Natural sleep support formula",
        sku: "SLEEP-OPT",
        price: 34.99,
        category: "Supplements",
      },
    }),
  ]);

  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      patientId: patientProfile.id,
      title: "Comprehensive Wellness Protocol",
      description: "Personalized plan based on initial lab panel and health goals.",
      goals: "Optimize vitamin D levels, improve gut health, enhance sleep quality",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const recommendation = await prisma.clinicalRecommendation.create({
    data: {
      patientId: patientProfile.id,
      treatmentPlanId: treatmentPlan.id,
      title: "Vitamin D Optimization",
      description: "Based on low vitamin D lab results, supplement with D3 daily.",
      protocol: "Take 5000 IU daily with a meal containing fat.",
      priority: 1,
      products: {
        create: [{ productId: products[0].id, dosage: "5000 IU", instructions: "Take daily with breakfast" }],
      },
    },
  });

  await prisma.labResult.createMany({
    data: [
      {
        patientId: patientProfile.id,
        testName: "Comprehensive Metabolic Panel",
        testDate: new Date("2025-05-01"),
        status: "REVIEWED",
        results: "All values within normal range",
        reviewedById: clinician.id,
        reviewedAt: new Date(),
      },
      {
        patientId: patientProfile.id,
        testName: "Vitamin D Panel",
        testDate: new Date("2025-05-15"),
        status: "FLAGGED",
        results: "Vitamin D: 22 ng/mL (Low)",
        notes: "Recommend supplementation",
        reviewedById: clinician.id,
        reviewedAt: new Date(),
      },
    ],
  });

  await prisma.consentForm.createMany({
    data: [
      {
        patientId: patientProfile.id,
        title: "HIPAA Authorization",
        type: "HIPAA",
        content: "I authorize Yooth Wellness to use and disclose my protected health information for treatment, payment, and healthcare operations.",
        status: "SIGNED",
        signedAt: new Date(),
        signature: "Jane Doe",
      },
      {
        patientId: patientProfile.id,
        title: "Treatment Consent",
        type: "TREATMENT",
        content: "I consent to receive wellness treatment recommendations and protocols as prescribed by my care team at Yooth Wellness.",
        status: "PENDING",
      },
    ],
  });

  const order = await prisma.order.create({
    data: {
      patientId: patientProfile.id,
      orderNumber: "YW-SEED-001",
      status: "PAID",
      subtotal: 69.98,
      tax: 5.60,
      total: 75.58,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 29.99, total: 29.99 },
          { productId: products[1].id, quantity: 1, unitPrice: 39.99, total: 39.99 },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patientProfile.id,
      providerId: clinician.id,
      title: "Initial Wellness Consultation",
      description: "Review lab results and treatment plan",
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration: 45,
      status: "CONFIRMED",
      location: "Telehealth",
    },
  });

  await prisma.message.create({
    data: {
      patientId: patientProfile.id,
      fromId: clinician.id,
      toId: patientUser.id,
      subject: "Welcome to Yooth Wellness",
      body: "Hi Jane, welcome to Yooth Wellness! I've reviewed your initial labs and created a personalized treatment plan. Please review it in your portal and let me know if you have any questions.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      title: "New treatment plan available",
      body: "Your care team has created a new treatment plan for you.",
      type: "INFO",
      link: "/portal/treatment",
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { actorId: admin.id, action: "SYSTEM_SEEDED", entityType: "System" },
      { actorId: patientUser.id, patientId: patientProfile.id, action: "USER_REGISTERED", entityType: "User", entityId: patientUser.id },
      { actorId: clinician.id, patientId: patientProfile.id, action: "TREATMENT_PLAN_CREATED", entityType: "TreatmentPlan", entityId: treatmentPlan.id },
      { actorId: patientUser.id, patientId: patientProfile.id, action: "ORDER_PAID", entityType: "Order", entityId: order.id },
    ],
  });

  console.log("Seed completed!");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Admin:     admin@yoothwell.com");
  console.log("  Clinician: clinician@yoothwell.com");
  console.log("  Patient:   patient@yoothwell.com");
  console.log("  Patient 2: john@yoothwell.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
