import { requirePatient, getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { PageHeader, StatCard } from "@/components/ui/page-elements";
import { FlaskConical, ClipboardList, ShoppingBag, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function PortalDashboard() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const [labs, plans, orders, appointments, notifications] = await Promise.all([
    prisma.labResult.count({ where: { patientId: profile.id } }),
    prisma.treatmentPlan.count({ where: { patientId: profile.id, status: "ACTIVE" } }),
    prisma.order.count({ where: { patientId: profile.id } }),
    prisma.appointment.count({
      where: { patientId: profile.id, scheduledAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    }),
    prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const recentLabs = await prisma.labResult.findMany({
    where: { patientId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Your wellness dashboard"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lab Results" value={labs} icon={FlaskConical} />
        <StatCard label="Active Plans" value={plans} icon={ClipboardList} />
        <StatCard label="Orders" value={orders} icon={ShoppingBag} />
        <StatCard label="Upcoming Appts" value={appointments} icon={Calendar} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Lab Results</CardTitle>
            <Link href="/portal/labs" className="text-sm text-teal-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentLabs.length === 0 ? (
              <p className="text-sm text-slate-500">No lab results yet</p>
            ) : (
              <ul className="space-y-2">
                {recentLabs.map((lab) => (
                  <li key={lab.id} className="flex items-center justify-between text-sm">
                    <span>{lab.testName}</span>
                    <Badge variant={lab.status === "REVIEWED" ? "success" : "warning"}>{lab.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No new notifications</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-slate-600">{n.body}</p>
                    <p className="text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
