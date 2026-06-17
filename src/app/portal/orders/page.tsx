import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderCheckout } from "@/components/portal/order-checkout";

export default async function PortalOrdersPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { patientId: profile.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Orders" description="View orders and purchase recommended products" />

      <div className="mb-8">
        <OrderCheckout products={products} />
      </div>

      <DataTable headers={["Order #", "Items", "Total", "Status", "Date", "Payment"]}>
        {orders.map((order) => (
          <tr key={order.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
            <td className="px-4 py-3 text-slate-600">
              {order.items.map((i) => `${i.product.name} (×${i.quantity})`).join(", ")}
            </td>
            <td className="px-4 py-3">{formatCurrency(order.total)}</td>
            <td className="px-4 py-3">
              <Badge variant={order.status === "PAID" ? "success" : "warning"}>{order.status}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
            <td className="px-4 py-3">
              {order.status === "PENDING" && order.paymentLinkUrl ? (
                <a href={order.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  Pay now
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
