import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminProductsPage() {
  await requireStaff();

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Products" description="Wellness products and protocols" />

      <DataTable headers={["Name", "SKU", "Category", "Price", "Status"]}>
        {products.map((product) => (
          <tr key={product.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{product.name}</td>
            <td className="px-4 py-3 text-slate-500">{product.sku ?? "—"}</td>
            <td className="px-4 py-3">{product.category ?? "—"}</td>
            <td className="px-4 py-3">{formatCurrency(product.price)}</td>
            <td className="px-4 py-3">
              <Badge variant={product.isActive ? "success" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
