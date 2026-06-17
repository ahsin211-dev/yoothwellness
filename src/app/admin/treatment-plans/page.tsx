import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";

export default async function AdminTreatmentPlansPage() {
  await requireStaff();

  const plans = await prisma.treatmentPlan.findMany({
    include: {
      patient: { include: { user: { select: { name: true } } } },
      _count: { select: { recommendations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Treatment Plans" description="Clinical treatment plans and protocols" />

      <DataTable headers={["Patient", "Title", "Status", "Start", "Recommendations", ""]}>
        {plans.map((plan) => (
          <tr key={plan.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{plan.patient.user.name}</td>
            <td className="px-4 py-3">{plan.title}</td>
            <td className="px-4 py-3">
              <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>{plan.status}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(plan.startDate)}</td>
            <td className="px-4 py-3">{plan._count.recommendations}</td>
            <td className="px-4 py-3">
              <Link href={`/admin/patients/${plan.patientId}`} className="text-teal-600 hover:underline">
                View patient
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
