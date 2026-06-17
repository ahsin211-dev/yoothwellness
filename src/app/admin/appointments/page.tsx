import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AdminAppointmentsPage() {
  await requireStaff();

  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: { select: { name: true } } } },
      provider: { select: { name: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Appointments" description="Scheduling and appointment management" />

      <DataTable headers={["Patient", "Title", "Provider", "Scheduled", "Duration", "Status", "Location"]}>
        {appointments.map((appt) => (
          <tr key={appt.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <Link href={`/admin/patients/${appt.patientId}`} className="font-medium text-teal-600 hover:underline">
                {appt.patient.user.name}
              </Link>
            </td>
            <td className="px-4 py-3">{appt.title}</td>
            <td className="px-4 py-3">{appt.provider?.name ?? "—"}</td>
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
    </div>
  );
}
