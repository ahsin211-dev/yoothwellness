import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";

export default async function AdminConsentsPage() {
  await requireStaff();

  const consents = await prisma.consentForm.findMany({
    include: { patient: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Consent Forms" description="Patient consent documents and signatures" />

      <DataTable headers={["Patient", "Title", "Type", "Status", "Signed", "Expires", "File"]}>
        {consents.map((consent) => (
          <tr key={consent.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{consent.patient.user.name}</td>
            <td className="px-4 py-3">{consent.title}</td>
            <td className="px-4 py-3 text-slate-600">{consent.type}</td>
            <td className="px-4 py-3">
              <Badge variant={consent.status === "SIGNED" ? "success" : "warning"}>
                {consent.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(consent.signedAt)}</td>
            <td className="px-4 py-3 text-slate-500">{formatDateShort(consent.expiresAt)}</td>
            <td className="px-4 py-3">
              {consent.fileUrl ? (
                <a href={consent.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
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
