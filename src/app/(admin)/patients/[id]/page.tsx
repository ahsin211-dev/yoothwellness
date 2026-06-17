import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatCurrency, getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FlaskConical,
  ShoppingCart,
  ClipboardList,
  FileText,
  Edit,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Patient Chart" };

async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      labResults: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { files: true },
      },
      treatmentPlans: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      consentForms: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      appointments: {
        orderBy: { appointmentDate: "desc" },
        take: 10,
      },
    },
  });
}

export default async function PatientChartPage({
  params,
}: {
  params: { id: string };
}) {
  const patient = await getPatient(params.id);

  if (!patient) notFound();

  const labStatusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    PENDING: "warning",
    RECEIVED: "info" as "secondary",
    REVIEWED: "success",
    FLAGGED: "destructive",
    ARCHIVED: "secondary",
  };

  const orderStatusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    DRAFT: "secondary",
    PENDING_PAYMENT: "warning",
    PAID: "success",
    PROCESSING: "info" as "secondary",
    SHIPPED: "default",
    DELIVERED: "success",
    CANCELLED: "destructive",
    REFUNDED: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/patients">
            <ArrowLeft className="w-4 h-4" />
            Back to patients
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/patients/${patient.id}/edit`}>
              <Edit className="w-4 h-4" />
              Edit profile
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/labs/new?patientId=${patient.id}`}>
              <FlaskConical className="w-4 h-4" />
              Upload labs
            </Link>
          </Button>
        </div>
      </div>

      {/* Patient header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={patient.user.image ?? undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-medium">
                {getInitials(patient.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{patient.user.name ?? "Unnamed Patient"}</h2>
                <Badge variant={patient.user.isActive ? "success" : "secondary"}>
                  {patient.user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{patient.user.email}</span>
                </div>
                {patient.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{patient.user.phone}</span>
                  </div>
                )}
                {(patient.city || patient.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>
                      {[patient.city, patient.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {patient.dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                  </div>
                )}
              </div>
              {/* Quick stats */}
              <div className="flex gap-6 pt-1">
                <div>
                  <p className="text-lg font-semibold">{patient.labResults.length}</p>
                  <p className="text-xs text-muted-foreground">Lab results</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-lg font-semibold">{patient.treatmentPlans.length}</p>
                  <p className="text-xs text-muted-foreground">Treatment plans</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-lg font-semibold">{patient.orders.length}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-lg font-semibold">
                    {formatDate(patient.user.lastLoginAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">Last login</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="labs">
            Lab Results
            {patient.labResults.filter((l) => l.status === "PENDING").length > 0 && (
              <Badge variant="warning" className="ml-1.5 text-xs">
                {patient.labResults.filter((l) => l.status === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Blood type" value={patient.bloodType} />
                <InfoRow
                  label="Height"
                  value={patient.height ? `${patient.height} cm` : null}
                />
                <InfoRow
                  label="Weight"
                  value={patient.weight ? `${patient.weight} kg` : null}
                />
                <InfoRow label="Primary physician" value={patient.primaryPhysician} />
                <InfoRow label="Insurance" value={patient.insuranceProvider} />
                <InfoRow label="Insurance ID" value={patient.insuranceId} />
                <Separator />
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Allergies
                  </p>
                  <p className="text-sm">{patient.allergies || "None reported"}</p>
                </div>
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current Medications
                  </p>
                  <p className="text-sm">{patient.currentMedications || "None reported"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact & Emergency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="City" value={patient.city} />
                <InfoRow label="State / Zip" value={[patient.state, patient.zip].filter(Boolean).join(" ") || null} />
                <InfoRow label="Country" value={patient.country} />
                <Separator />
                <InfoRow label="Emergency contact" value={patient.emergencyName} />
                <InfoRow label="Emergency phone" value={patient.emergencyPhone} />
              </CardContent>
            </Card>
          </div>

          {patient.medicalHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{patient.medicalHistory}</p>
              </CardContent>
            </Card>
          )}

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Labs tab */}
        <TabsContent value="labs" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link href={`/admin/labs/new?patientId=${patient.id}`}>
                <FlaskConical className="w-4 h-4" />
                Upload new result
              </Link>
            </Button>
          </div>
          {patient.labResults.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No lab results uploaded yet.
              </CardContent>
            </Card>
          ) : (
            patient.labResults.map((lab) => (
              <Card key={lab.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FlaskConical className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lab.testName}</p>
                        <p className="text-xs text-muted-foreground">{lab.labName}</p>
                        {lab.collectedAt && (
                          <p className="text-xs text-muted-foreground">
                            Collected: {formatDate(lab.collectedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lab.flagged && (
                        <Badge variant="destructive">Flagged</Badge>
                      )}
                      <Badge variant={labStatusColors[lab.status] ?? "secondary"}>
                        {lab.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lab.files.length} file{lab.files.length !== 1 ? "s" : ""}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/labs/${lab.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Treatment Plans tab */}
        <TabsContent value="treatment" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link href={`/admin/treatment-plans/new?patientId=${patient.id}`}>
                <ClipboardList className="w-4 h-4" />
                New plan
              </Link>
            </Button>
          </div>
          {patient.treatmentPlans.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No treatment plans created yet.
              </CardContent>
            </Card>
          ) : (
            patient.treatmentPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {plan.items.length} item{plan.items.length !== 1 ? "s" : ""}
                        {plan.startDate &&
                          ` · Started ${formatDate(plan.startDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>
                        {plan.status}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/treatment-plans/${plan.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" asChild>
              <Link href={`/admin/orders/new?patientId=${patient.id}`}>
                <ShoppingCart className="w-4 h-4" />
                Create order
              </Link>
            </Button>
          </div>
          {patient.orders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No orders placed yet.
              </CardContent>
            </Card>
          ) : (
            patient.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <Badge variant={orderStatusColors[order.status] ?? "secondary"}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4 space-y-3">
          {patient.documents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No documents uploaded yet.
              </CardContent>
            </Card>
          ) : (
            patient.documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category ?? "General"} · {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Appointments tab */}
        <TabsContent value="appointments" className="mt-4 space-y-3">
          {patient.appointments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No appointments scheduled yet.
              </CardContent>
            </Card>
          ) : (
            patient.appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{apt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(apt.appointmentDate)} ·{" "}
                        {apt.duration} min ·{" "}
                        {apt.isVirtual ? "Virtual" : "In-person"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        apt.status === "COMPLETED"
                          ? "success"
                          : apt.status === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {apt.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}
