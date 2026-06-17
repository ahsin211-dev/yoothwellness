import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export async function createPaymentLink(params: {
  patientId: string;
  orderId: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitAmount: number; // cents
    currency?: string;
  }>;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const lineItems = await Promise.all(
    params.lineItems.map(async (item) => {
      const price = await stripe.prices.create({
        currency: item.currency ?? "usd",
        unit_amount: item.unitAmount,
        product_data: {
          name: item.name,
        },
      });
      return {
        price: price.id,
        quantity: item.quantity,
      };
    })
  );

  const paymentLink = await stripe.paymentLinks.create({
    line_items: lineItems,
    metadata: {
      orderId: params.orderId,
      patientId: params.patientId,
      ...params.metadata,
    },
    after_completion: {
      type: "redirect",
      redirect: {
        url: params.successUrl ?? `${baseUrl}/portal/orders/${params.orderId}?success=1`,
      },
    },
  });

  return paymentLink;
}

export async function createCheckoutSession(params: {
  patientId: string;
  orderId: string;
  stripeCustomerId?: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitAmount: number;
  }>;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const lineItems = params.lineItems.map((item) => ({
    price_data: {
      currency: "usd",
      unit_amount: item.unitAmount,
      product_data: {
        name: item.name,
      },
    },
    quantity: item.quantity,
  }));

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    success_url: params.successUrl ?? `${baseUrl}/portal/orders/${params.orderId}?success=1`,
    cancel_url: params.cancelUrl ?? `${baseUrl}/portal/orders/${params.orderId}?cancelled=1`,
    metadata: {
      orderId: params.orderId,
      patientId: params.patientId,
      ...params.metadata,
    },
  };

  if (params.stripeCustomerId) {
    sessionParams.customer = params.stripeCustomerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
