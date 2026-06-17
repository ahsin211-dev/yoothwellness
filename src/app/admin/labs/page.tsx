import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";

const statusVariant = (status: string) => {
  if (status === "REVIEWED") return "success" as const;
  if (status === "FLAGGED") return "danger" as const;
  return "warning" as const;
};

export default async function AdminLabsPage() {
  await requireStaff();

  const labs = await prisma.labResult.findMany({
    include: {
      patient: { include: { user: { select: { name: true } } } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Lab Results" description="Review and manage patient lab results" />

      <DataTable headers={["Patient", "Test", "Date", "Status", "Reviewed By", "File", ""]}>
        {labs.map((lab) => (
          <tr key={lab.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{lab.patient.user.name}</td>
            <td className="px-4 py-3">{lab.testName}</td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(lab.testDate ?? lab.createdAt)}</td>
            <td className="px-4 py-3">
              <Badge variant={statusVariant(lab.status)}>{lab.status}</Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{lab.reviewedBy?.name ?? "—"}</td>
            <td className="px-4 py-3">
              {lab.fileUrl ? (
                <a href={lab.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  View
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3">
              <Link href={`/admin/patients/${lab.patientId}`} className="text-teal-600 hover:underline">
                Patient
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
