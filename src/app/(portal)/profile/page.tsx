import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };

export default async function PortalProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Patient profile not found. Please contact your care team.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your personal and medical information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Full name" value={patient.user.name} />
            <InfoItem label="Email" value={patient.user.email} />
            <InfoItem label="Phone" value={patient.user.phone} />
            <InfoItem label="Date of birth" value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : null} />
            <InfoItem label="Gender" value={patient.gender} />
            <InfoItem label="Blood type" value={patient.bloodType} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Street address" value={patient.address} />
            <InfoItem label="City" value={patient.city} />
            <InfoItem label="State" value={patient.state} />
            <InfoItem label="Zip code" value={patient.zip} />
            <InfoItem label="Country" value={patient.country} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical Information</CardTitle>
          <CardDescription>For your care team&apos;s reference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem
              label="Height"
              value={patient.height ? `${patient.height} cm` : null}
            />
            <InfoItem
              label="Weight"
              value={patient.weight ? `${patient.weight} kg` : null}
            />
            <InfoItem label="Primary physician" value={patient.primaryPhysician} />
            <InfoItem label="Insurance provider" value={patient.insuranceProvider} />
            <InfoItem label="Insurance ID" value={patient.insuranceId} />
          </div>
          <Separator />
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Allergies
              </p>
              <p>{patient.allergies || "None reported"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Current Medications
              </p>
              <p className="whitespace-pre-wrap">{patient.currentMedications || "None reported"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Name" value={patient.emergencyName} />
            <InfoItem label="Phone" value={patient.emergencyPhone} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
        {label}
      </p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}
