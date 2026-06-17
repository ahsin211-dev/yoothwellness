import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function PortalAppointmentsPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: profile.id },
    include: { provider: { select: { name: true } } },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Appointments" description="Your scheduled appointments" />

      <DataTable headers={["Title", "Provider", "Scheduled", "Duration", "Status", "Location"]}>
        {appointments.map((appt) => (
          <tr key={appt.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{appt.title}</td>
            <td className="px-4 py-3">{appt.provider?.name ?? "TBD"}</td>
            <td className="px-4 py-3 text-slate-500">{formatDate(appt.scheduledAt)}</td>
            <td className="px-4 py-3">{appt.duration} min</td>
            <td className="px-4 py-3">
              <Badge variant={appt.status === "COMPLETED" ? "success" : appt.status === "CANCELLED" ? "danger" : "info"}>
                {appt.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{appt.location ?? "—"}</td>
          </tr>
        ))}
      </DataTable>
      {appointments.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">No appointments scheduled</p>
      )}
    </div>
  );
}
