import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatFileSize } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

export const metadata: Metadata = { title: "Documents" };

export default async function PortalDocumentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Patient profile not found.
      </div>
    );
  }

  const [documents, consentForms] = await Promise.all([
    prisma.patientDocument.findMany({
      where: { patientId: patient.id },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.consentForm.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const consentStatusVariant = (status: string) => {
    switch (status) {
      case "SIGNED": return "success";
      case "DECLINED": return "destructive";
      case "PENDING": return "warning";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your health documents and consent forms
        </p>
      </div>

      {/* Consent Forms */}
      {consentForms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Consent Forms</h3>
          {consentForms.map((form) => (
            <Card
              key={form.id}
              className={form.status === "PENDING" ? "border-amber-300 bg-amber-50/50" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10 mt-0.5">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{form.title}</p>
                      {form.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {form.description}
                        </p>
                      )}
                      {form.signedAt && (
                        <p className="text-xs text-muted-foreground">
                          Signed: {formatDate(form.signedAt)}
                        </p>
                      )}
                      {form.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {formatDate(form.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={consentStatusVariant(form.status) as "success" | "destructive" | "warning" | "secondary"}>
                      {form.status}
                    </Badge>
                    {form.status === "PENDING" && (
                      <Button size="sm">Review & Sign</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Documents */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Files & Documents</h3>
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32 gap-3">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No documents uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-md bg-muted">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.category ?? "General"} · {formatFileSize(doc.fileSize)} ·{" "}
                      {formatDate(doc.uploadedAt)}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
