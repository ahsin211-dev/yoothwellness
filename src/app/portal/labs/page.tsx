import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import { LabUploadForm } from "@/components/portal/lab-upload-form";

export default async function PortalLabsPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const labs = await prisma.labResult.findMany({
    where: { patientId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Lab Results" description="View and upload your lab results" />

      <div className="mb-8">
        <LabUploadForm />
      </div>

      <DataTable headers={["Test Name", "Date", "Status", "Results", "File"]}>
        {labs.map((lab) => (
          <tr key={lab.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{lab.testName}</td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(lab.testDate ?? lab.createdAt)}</td>
            <td className="px-4 py-3">
              <Badge variant={lab.status === "REVIEWED" ? "success" : lab.status === "FLAGGED" ? "danger" : "warning"}>
                {lab.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-slate-600">{lab.results ?? "Pending review"}</td>
            <td className="px-4 py-3">
              {lab.fileUrl ? (
                <a href={lab.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  View
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
