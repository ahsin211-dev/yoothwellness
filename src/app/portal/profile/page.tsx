import { requirePatient } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { PageHeader } from "@/components/ui/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/portal/profile-form";

export default async function PortalProfilePage() {
  const sessionUser = await requirePatient();
  const profile = await getPatientProfileForUser(sessionUser.id);
  if (!profile) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, phone: true },
  });
  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal and medical information" />

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{ name: user.name, email: user.email, phone: user.phone }}
            profile={{
              ...profile,
              dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
