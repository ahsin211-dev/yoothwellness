import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminPatientsPage() {
  await requireStaff();

  const patients = await prisma.patientProfile.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, isActive: true } },
      _count: { select: { labResults: true, orders: true, treatmentPlans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Patients" description="Manage patient profiles and charts" />

      <DataTable headers={["Name", "Email", "Labs", "Orders", "Plans", "Joined", ""]}>
        {patients.map((patient) => (
          <tr key={patient.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{patient.user.name}</td>
            <td className="px-4 py-3 text-slate-600">{patient.user.email}</td>
            <td className="px-4 py-3">{patient._count.labResults}</td>
            <td className="px-4 py-3">{patient._count.orders}</td>
            <td className="px-4 py-3">{patient._count.treatmentPlans}</td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(patient.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant={patient.user.isActive ? "success" : "danger"}>
                  {patient.user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Link
                  href={`/admin/patients/${patient.id}`}
                  className="text-teal-600 hover:underline"
                >
                  View
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
