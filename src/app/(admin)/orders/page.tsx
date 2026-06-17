import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ShoppingCart, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      patient: {
        include: { user: { select: { name: true, email: true } } },
      },
      items: true,
    },
  });

  const statusConfig: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "default" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING_PAYMENT: { label: "Pending Payment", variant: "warning" },
    PAID: { label: "Paid", variant: "success" },
    PROCESSING: { label: "Processing", variant: "default" },
    SHIPPED: { label: "Shipped", variant: "default" },
    DELIVERED: { label: "Delivered", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
    REFUNDED: { label: "Refunded", variant: "secondary" },
  };

  const totalRevenue = orders
    .filter((o) => ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} orders · {formatCurrency(totalRevenue)} collected
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/orders/new">
            <Plus className="w-4 h-4" />
            Create order
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status] ?? { label: order.status, variant: "secondary" };
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.patient.user.name ?? order.patient.user.email} ·{" "}
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      {order.stripePaymentLinkUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={order.stripePaymentLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open payment link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
