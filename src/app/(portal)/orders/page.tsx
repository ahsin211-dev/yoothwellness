import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ShoppingCart, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "My Orders" };

export default async function PortalOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Patient profile not found.
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const statusConfig: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "default" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING_PAYMENT: { label: "Awaiting Payment", variant: "warning" },
    PAID: { label: "Paid", variant: "success" },
    PROCESSING: { label: "Processing", variant: "default" },
    SHIPPED: { label: "Shipped", variant: "default" },
    DELIVERED: { label: "Delivered", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
    REFUNDED: { label: "Refunded", variant: "secondary" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Orders</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Orders created by your care team will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] ?? { label: order.status, variant: "secondary" };
            return (
              <Card key={order.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">
                          {item.productName}
                          <span className="text-muted-foreground ml-1">
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pay button for pending payment */}
                  {order.status === "PENDING_PAYMENT" && order.stripePaymentLinkUrl && (
                    <div className="pt-2">
                      <Button asChild className="w-full sm:w-auto">
                        <a
                          href={order.stripePaymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Complete payment
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <p className="text-sm text-muted-foreground">
                      Tracking: {order.trackingNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
