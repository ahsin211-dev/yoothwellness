import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logActivity } from "@/lib/activity";

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requirePatient();
    const profile = await getPatientProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const productIds = parsed.data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Invalid products" }, { status: 400 });
    }

    const orderItems = parsed.data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        total: product.price * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        patientId: profile.id,
        orderNumber: generateOrderNumber(),
        subtotal,
        tax,
        total,
        status: "PENDING",
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    let paymentUrl: string | null = null;

    const stripe = getStripe();
    if (stripe && isStripeConfigured()) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: order.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.product.name },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })),
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/orders?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/orders?cancelled=true`,
      });

      paymentUrl = session.url;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: session.id,
          paymentLinkUrl: session.url,
        },
      });
    }

    await logActivity({
      actorId: user.id,
      patientId: profile.id,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
