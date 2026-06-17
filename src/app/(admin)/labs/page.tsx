import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FlaskConical, AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Lab Results" };

export default async function AdminLabsPage() {
  const labs = await prisma.labResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      patient: {
        include: { user: { select: { name: true, email: true } } },
      },
      files: { select: { id: true } },
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lab Results</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {labs.filter((l) => l.status === "PENDING").length} pending review
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/labs/new">
            <Upload className="w-4 h-4" />
            Upload results
          </Link>
        </Button>
      </div>

      {labs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <FlaskConical className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No lab results uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <Card key={lab.id} className={lab.flagged ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    {lab.flagged ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <FlaskConical className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{lab.testName}</p>
                      {lab.flagged && <Badge variant="destructive">Flagged</Badge>}
                      <Badge variant={statusVariant(lab.status) as "success" | "destructive" | "warning" | "secondary"}>
                        {lab.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lab.patient.user.name ?? lab.patient.user.email} · {lab.labName}
                    </p>
                    {lab.collectedAt && (
                      <p className="text-xs text-muted-foreground">
                        Collected: {formatDate(lab.collectedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {lab.files.length} file{lab.files.length !== 1 ? "s" : ""}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/labs/${lab.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
