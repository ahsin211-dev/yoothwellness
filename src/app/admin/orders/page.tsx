import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminOrdersPage() {
  await requireStaff();

  const orders = await prisma.order.findMany({
    include: {
      patient: { include: { user: { select: { name: true } } } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Orders" description="Patient orders and payment status" />

      <DataTable headers={["Order #", "Patient", "Items", "Total", "Status", "Date", "Payment"]}>
        {orders.map((order) => (
          <tr key={order.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
            <td className="px-4 py-3">{order.patient.user.name}</td>
            <td className="px-4 py-3 text-slate-600">
              {order.items.map((i) => `${i.product.name} (×${i.quantity})`).join(", ")}
            </td>
            <td className="px-4 py-3">{formatCurrency(order.total)}</td>
            <td className="px-4 py-3">
              <Badge variant={order.status === "PAID" ? "success" : order.status === "PENDING" ? "warning" : "secondary"}>
                {order.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
            <td className="px-4 py-3">
              {order.paymentLinkUrl ? (
                <a href={order.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  Link
                </a>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
