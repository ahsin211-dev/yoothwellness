import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CLINICIAN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { labResults: true, orders: true, treatmentPlans: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: patients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CLINICIAN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPatientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, phone, dateOfBirth, gender, bloodType, address, city, state, zip } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : await bcrypt.hash(Math.random().toString(36), 12); // temp password

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "PATIENT",
      patient: {
        create: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          bloodType,
          address,
          city,
          state,
          zip,
        },
      },
    },
    include: {
      patient: true,
    },
  });

  // Log admin action
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      adminId: session.user.id,
      type: "ADMIN_ACTION",
      description: `Patient account created by ${session.user.name ?? session.user.email}`,
    },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
