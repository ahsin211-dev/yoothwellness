import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yoothwellness.com" },
    update: {},
    create: {
      email: "admin@yoothwellness.com",
      name: "Dr. Sarah Chen",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);

  // Create clinician
  const clinicianPassword = await bcrypt.hash("Clinician@123!", 12);
  const clinician = await prisma.user.upsert({
    where: { email: "clinician@yoothwellness.com" },
    update: {},
    create: {
      email: "clinician@yoothwellness.com",
      name: "Dr. James Park",
      passwordHash: clinicianPassword,
      role: "CLINICIAN",
      isActive: true,
    },
  });

  console.log(`✅ Clinician user: ${clinician.email}`);

  // Create patient user
  const patientPassword = await bcrypt.hash("Patient@123!", 12);
  const patientUser = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      email: "patient@example.com",
      name: "Alex Johnson",
      passwordHash: patientPassword,
      role: "PATIENT",
      phone: "+1 (555) 123-4567",
      isActive: true,
      patient: {
        create: {
          dateOfBirth: new Date("1985-06-15"),
          gender: "MALE",
          bloodType: "O+",
          height: 178,
          weight: 82,
          address: "123 Wellness Ave",
          city: "San Francisco",
          state: "CA",
          zip: "94102",
          country: "US",
          emergencyName: "Jane Johnson",
          emergencyPhone: "+1 (555) 987-6543",
          primaryPhysician: "Dr. Sarah Chen",
          insuranceProvider: "Blue Shield",
          insuranceId: "BS-12345678",
          allergies: "Penicillin, Shellfish",
          currentMedications: "Vitamin D3 5000 IU daily\nOmega-3 2g daily",
          medicalHistory: "Hypothyroidism (2018)\nPre-diabetes (2022) - managed with diet",
          notes: "Patient is motivated and follows protocol well. Focus on metabolic optimization.",
        },
      },
    },
    include: { patient: true },
  });

  console.log(`✅ Patient user: ${patientUser.email}`);

  const patient = patientUser.patient!;

  // Create lab result
  const labResult = await prisma.labResult.create({
    data: {
      patientId: patient.id,
      uploadedById: admin.id,
      labName: "LabCorp",
      testName: "Comprehensive Metabolic Panel + Hormones",
      collectedAt: new Date("2025-11-15"),
      receivedAt: new Date("2025-11-17"),
      status: "REVIEWED",
      notes: "Overall markers showing improvement from baseline. Testosterone trending up. Continue current protocol.",
      biomarkers: {
        create: [
          { name: "Testosterone (Total)", value: 485, unit: "ng/dL", referenceMin: 264, referenceMax: 916, isInRange: true },
          { name: "Free Testosterone", value: 8.2, unit: "pg/mL", referenceMin: 6.8, referenceMax: 21.5, isInRange: true },
          { name: "TSH", value: 2.1, unit: "mIU/L", referenceMin: 0.45, referenceMax: 4.5, isInRange: true },
          { name: "Free T4", value: 1.1, unit: "ng/dL", referenceMin: 0.82, referenceMax: 1.77, isInRange: true },
          { name: "HbA1c", value: 5.8, unit: "%", referenceMin: 0, referenceMax: 5.7, isInRange: false, notes: "Slightly elevated — continue dietary interventions" },
          { name: "Glucose (fasting)", value: 98, unit: "mg/dL", referenceMin: 70, referenceMax: 100, isInRange: true },
          { name: "Insulin", value: 8.4, unit: "µIU/mL", referenceMin: 2.0, referenceMax: 19.6, isInRange: true },
          { name: "Vitamin D (25-OH)", value: 42, unit: "ng/mL", referenceMin: 30, referenceMax: 100, isInRange: true },
        ],
      },
    },
  });

  console.log(`✅ Lab result created for patient`);

  // Create treatment plan
  await prisma.treatmentPlan.create({
    data: {
      patientId: patient.id,
      createdById: admin.id,
      title: "Metabolic Optimization Protocol",
      description: "Comprehensive protocol to optimize metabolic health, hormone balance, and vitality.",
      goals: "• Normalize HbA1c below 5.7%\n• Optimize testosterone to 600+ ng/dL\n• Improve body composition\n• Enhance energy and cognitive function",
      startDate: new Date("2025-11-20"),
      status: "ACTIVE",
      items: {
        create: [
          {
            category: "Supplement",
            name: "Vitamin D3 + K2",
            description: "Essential for hormone production and bone health",
            dosage: "5000 IU D3 / 100mcg K2",
            frequency: "Once daily with fat-containing meal",
            duration: "Ongoing",
            sortOrder: 1,
          },
          {
            category: "Supplement",
            name: "Omega-3 Fish Oil",
            description: "Anti-inflammatory, supports cardiovascular and hormonal health",
            dosage: "2g EPA/DHA",
            frequency: "Twice daily with meals",
            duration: "Ongoing",
            sortOrder: 2,
          },
          {
            category: "Supplement",
            name: "Magnesium Glycinate",
            description: "Supports sleep quality, glucose metabolism, and testosterone",
            dosage: "400mg",
            frequency: "Once daily before bed",
            duration: "Ongoing",
            sortOrder: 3,
          },
          {
            category: "Nutrition",
            name: "Low-glycemic diet",
            description: "Focus on whole foods, lean protein, healthy fats. Limit refined carbohydrates.",
            instructions: "Target: <150g net carbs/day. Prioritize: eggs, fatty fish, leafy greens, avocado, olive oil. Avoid: sugar, white bread, processed foods.",
            frequency: "Daily",
            sortOrder: 4,
          },
          {
            category: "Exercise",
            name: "Resistance Training",
            description: "Progressive strength training to improve insulin sensitivity and hormone levels",
            frequency: "3-4x per week",
            duration: "45-60 min per session",
            instructions: "Focus on compound movements: squats, deadlifts, bench press, rows. Progressive overload each week.",
            sortOrder: 5,
          },
          {
            category: "Lab Test",
            name: "Follow-up Comprehensive Panel",
            description: "Re-check key biomarkers to assess protocol effectiveness",
            frequency: "In 90 days",
            instructions: "Include: CBC, CMP, lipids, testosterone (total + free), TSH, free T4, HbA1c, fasting insulin, Vitamin D",
            sortOrder: 6,
          },
        ],
      },
    },
  });

  console.log(`✅ Treatment plan created`);

  // Create consent form
  await prisma.consentForm.create({
    data: {
      patientId: patient.id,
      title: "Informed Consent for Wellness Services",
      description: "Please review and sign this consent form to begin your wellness program",
      content: `INFORMED CONSENT FOR WELLNESS SERVICES

By signing this document, you acknowledge and agree to the following:

1. NATURE OF SERVICES
Yooth Wellness provides personalized wellness consulting, functional health assessments, and lifestyle optimization protocols. Our services are complementary and do not replace conventional medical care.

2. PATIENT RESPONSIBILITIES
- Disclose all current medications, supplements, and health conditions
- Inform your primary care physician of any protocols recommended
- Seek emergency care for any urgent medical concerns

3. PRIVACY & CONFIDENTIALITY
Your health information is protected in accordance with applicable privacy laws. We will not share your information without your explicit consent except as required by law.

4. LIMITATIONS
Recommendations are based on functional health principles and are not intended to diagnose, treat, cure, or prevent any disease.

I have read and understand the above information and consent to receive wellness services from Yooth Wellness.`,
      version: "1.0",
      status: "PENDING",
    },
  });

  console.log(`✅ Consent form created`);

  // Create an order
  const order = await prisma.order.create({
    data: {
      patientId: patient.id,
      createdById: admin.id,
      status: "PENDING_PAYMENT",
      subtotal: 124.97,
      total: 124.97,
      notes: "Monthly supplement protocol as per treatment plan.",
      items: {
        create: [
          {
            productName: "Vitamin D3 + K2 (90-day supply)",
            quantity: 1,
            unitPrice: 34.99,
            subtotal: 34.99,
          },
          {
            productName: "Omega-3 Fish Oil 2g (90-day supply)",
            quantity: 1,
            unitPrice: 54.99,
            subtotal: 54.99,
          },
          {
            productName: "Magnesium Glycinate 400mg (90-day supply)",
            quantity: 1,
            unitPrice: 34.99,
            subtotal: 34.99,
          },
        ],
      },
    },
  });

  console.log(`✅ Order created: #${order.id.slice(-8).toUpperCase()}`);

  // Create message from admin to patient
  await prisma.message.create({
    data: {
      fromUserId: admin.id,
      toUserId: patientUser.id,
      subject: "Welcome to Yooth Wellness!",
      body: `Hi Alex,

Welcome to Yooth Wellness! We're excited to be part of your health journey.

Here's what to expect next:
1. Review your treatment plan under the "Treatment Plans" section
2. Sign the consent form in "Documents"  
3. Complete your supplement order when ready

Your latest lab results have been uploaded and reviewed. Please reach out if you have any questions about your biomarkers or protocol.

Looking forward to working with you!

Dr. Sarah Chen
Yooth Wellness`,
      status: "UNREAD",
    },
  });

  console.log(`✅ Welcome message sent`);

  // Create appointment
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  futureDate.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      scheduledById: admin.id,
      title: "90-Day Follow-up Consultation",
      description: "Review progress on metabolic optimization protocol and adjust as needed",
      appointmentDate: futureDate,
      duration: 60,
      isVirtual: true,
      meetingUrl: "https://meet.google.com/example-meeting",
      status: "CONFIRMED",
    },
  });

  console.log(`✅ Appointment scheduled`);

  console.log("\n✨ Seed complete!\n");
  console.log("Credentials:");
  console.log("  Admin:     admin@yoothwellness.com / Admin@123!");
  console.log("  Clinician: clinician@yoothwellness.com / Clinician@123!");
  console.log("  Patient:   patient@example.com / Patient@123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
