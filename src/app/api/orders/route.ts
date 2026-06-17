import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createPaymentLink } from "@/lib/stripe";
import { logActivity } from "@/lib/activity";

const orderItemSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive("Unit price must be positive"),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
});

const createOrderSchema = z.object({
  patientId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  shippingName: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  generatePaymentLink: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  let patientId = searchParams.get("patientId");

  if (session.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient profile not found" }, { status: 404 });
    }
    patientId = patient.id;
  }

  const where = patientId ? { patientId } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 100,
  });

  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CLINICIAN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { patientId, items, notes, shippingName, shippingAddress, shippingCity, shippingState, shippingZip, generatePaymentLink: shouldGenerateLink } = parsed.data;

  // Verify patient
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!patient) {
    return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal; // Extend with tax/discount logic as needed

  // Create order
  const order = await prisma.order.create({
    data: {
      patientId,
      createdById: session.user.id,
      status: "PENDING_PAYMENT",
      subtotal,
      total,
      notes,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      items: {
        create: items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
          stripeProductId: item.stripeProductId,
          stripePriceId: item.stripePriceId,
        })),
      },
    },
    include: { items: true },
  });

  // Generate Stripe payment link
  let stripePaymentLinkUrl: string | null = null;

  if (shouldGenerateLink && process.env.STRIPE_SECRET_KEY) {
    try {
      const paymentLink = await createPaymentLink({
        patientId,
        orderId: order.id,
        lineItems: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitAmount: Math.round(item.unitPrice * 100), // cents
        })),
        customerEmail: patient.user.email,
        metadata: { orderId: order.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripePaymentLinkId: paymentLink.id,
          stripePaymentLinkUrl: paymentLink.url,
        },
      });

      stripePaymentLinkUrl = paymentLink.url;
    } catch (err) {
      console.error("[Orders] Failed to create Stripe payment link:", err);
      // Continue — order is created even if payment link fails
    }
  }

  // Log activity
  await logActivity({
    userId: patient.user.id,
    adminId: session.user.id,
    type: "ORDER_CREATED",
    description: `Order #${order.id.slice(-8).toUpperCase()} created by care team`,
    metadata: { orderId: order.id, total },
  });

  return NextResponse.json(
    {
      success: true,
      data: { ...order, stripePaymentLinkUrl },
    },
    { status: 201 }
  );
}
