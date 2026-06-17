import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { constructWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      default:
        // Unhandled event types — log and move on
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[Stripe Webhook] checkout.session.completed missing orderId in metadata");
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      patient: { include: { user: { select: { id: true } } } },
    },
  });

  if (!order) {
    console.warn(`[Stripe Webhook] Order ${orderId} not found`);
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
    },
  });

  await logActivity({
    userId: order.patient.user.id,
    type: "ORDER_PAID",
    description: `Order #${orderId.slice(-8).toUpperCase()} payment completed`,
    metadata: { orderId, stripeSessionId: session.id },
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existing || existing.status === "PAID") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
    },
  });
}
