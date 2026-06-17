import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FlaskConical, Download, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Lab Results" };

export default async function PortalLabsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Patient profile not found. Please contact your care team.
      </div>
    );
  }

  const labResults = await prisma.labResult.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    include: {
      files: true,
      biomarkers: true,
    },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "REVIEWED": return "success";
      case "FLAGGED": return "destructive";
      case "PENDING": return "warning";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lab Results</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your complete lab history
        </p>
      </div>

      {labResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <FlaskConical className="w-10 h-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No lab results yet</p>
              <p className="text-sm text-muted-foreground">
                Your care team will upload results after your tests
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {labResults.map((lab) => (
            <Card key={lab.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 mt-0.5">
                      <FlaskConical className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{lab.testName}</CardTitle>
                      <CardDescription>{lab.labName}</CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lab.flagged && <Badge variant="destructive">Flagged</Badge>}
                        <Badge variant={statusVariant(lab.status) as "success" | "destructive" | "warning" | "secondary"}>
                          {lab.status}
                        </Badge>
                        {lab.collectedAt && (
                          <span className="text-xs text-muted-foreground">
                            Collected: {formatDate(lab.collectedAt)}
                          </span>
                        )}
                        {lab.reviewedAt && (
                          <span className="text-xs text-muted-foreground">
                            Reviewed: {formatDate(lab.reviewedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Biomarkers */}
                {lab.biomarkers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Biomarkers
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {lab.biomarkers.map((marker) => (
                        <div
                          key={marker.id}
                          className={`p-3 rounded-md border text-sm ${
                            marker.isInRange === false
                              ? "border-red-200 bg-red-50"
                              : marker.isInRange === true
                              ? "border-green-200 bg-green-50"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <p className="font-medium truncate">{marker.name}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {marker.value !== null ? `${marker.value} ${marker.unit ?? ""}` : "—"}
                            {marker.referenceMin !== null && marker.referenceMax !== null && (
                              <span>
                                {" "}
                                (Ref: {marker.referenceMin}–{marker.referenceMax})
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {lab.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Clinical Notes
                    </p>
                    <p className="text-sm text-foreground">{lab.notes}</p>
                  </div>
                )}

                {/* Flagged reason */}
                {lab.flagged && lab.flagReason && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-700">
                      Flagged: {lab.flagReason}
                    </p>
                  </div>
                )}

                {/* Files */}
                {lab.files.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Attachments ({lab.files.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lab.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border bg-background hover:bg-muted transition-colors"
                        >
                          {file.mimeType === "application/pdf" ? (
                            <Download className="w-3.5 h-3.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
