import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import { ConsentSignForm } from "@/components/portal/consent-sign-form";

export default async function PortalConsentsPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const consents = await prisma.consentForm.findMany({
    where: { patientId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Consent Forms" description="Review and sign required consent documents" />

      <div className="space-y-4">
        {consents.map((consent) => (
          <Card key={consent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{consent.title}</CardTitle>
                <Badge variant={consent.status === "SIGNED" ? "success" : "warning"}>
                  {consent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Type: {consent.type}</p>
              {consent.content && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {consent.content}
                </div>
              )}
              {consent.status === "SIGNED" ? (
                <p className="text-sm text-slate-500">Signed on {formatDateShort(consent.signedAt)}</p>
              ) : (
                <ConsentSignForm consentId={consent.id} />
              )}
              {consent.fileUrl && (
                <a href={consent.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline">
                  View document
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {consents.length === 0 && (
          <p className="text-center text-sm text-slate-500">No consent forms required at this time</p>
        )}
      </div>
    </div>
  );
}
