import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateShort } from "@/lib/utils";
import Link from "next/link";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const patient = await prisma.patientProfile.findUnique({
    where: { id },
    include: {
      user: true,
      labResults: { orderBy: { createdAt: "desc" }, take: 5 },
      treatmentPlans: { orderBy: { createdAt: "desc" }, take: 5 },
      orders: { orderBy: { createdAt: "desc" }, take: 5, include: { items: true } },
      consentForms: { orderBy: { createdAt: "desc" }, take: 5 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 5 },
      recommendations: { where: { isActive: true }, include: { products: { include: { product: true } } } },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <PageHeader
        title={patient.user.name}
        description={patient.user.email}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Phone:</span> {patient.user.phone ?? "—"}</p>
            <p><span className="font-medium">DOB:</span> {formatDateShort(patient.dateOfBirth)}</p>
            <p><span className="font-medium">Gender:</span> {patient.gender ?? "—"}</p>
            <p><span className="font-medium">Address:</span> {[patient.address, patient.city, patient.state, patient.zipCode].filter(Boolean).join(", ") || "—"}</p>
            <p><span className="font-medium">Allergies:</span> {patient.allergies ?? "—"}</p>
            <p><span className="font-medium">Medical History:</span> {patient.medicalHistory ?? "—"}</p>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Lab Results</CardTitle>
              <Link href="/admin/labs" className="text-sm text-teal-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {patient.labResults.length === 0 ? (
                <p className="text-sm text-slate-500">No lab results</p>
              ) : (
                <ul className="space-y-2">
                  {patient.labResults.map((lab) => (
                    <li key={lab.id} className="flex items-center justify-between text-sm">
                      <span>{lab.testName}</span>
                      <Badge variant={lab.status === "REVIEWED" ? "success" : lab.status === "FLAGGED" ? "danger" : "warning"}>
                        {lab.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">No active recommendations</p>
              ) : (
                <ul className="space-y-3">
                  {patient.recommendations.map((rec) => (
                    <li key={rec.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                      <p className="font-medium">{rec.title}</p>
                      {rec.description && <p className="text-slate-600">{rec.description}</p>}
                      {rec.products.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Products: {rec.products.map((p) => p.product.name).join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders</p>
              ) : (
                <ul className="space-y-2">
                  {patient.orders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between text-sm">
                      <span>{order.orderNumber}</span>
                      <div className="flex items-center gap-2">
                        <Badge>{order.status}</Badge>
                        <span className="text-slate-500">{formatDate(order.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
