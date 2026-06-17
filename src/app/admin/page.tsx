import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui/page-elements";
import { Users, FlaskConical, ShoppingBag, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireStaff();

  const [
    patientCount,
    pendingLabs,
    activeOrders,
    upcomingAppointments,
    unreadMessages,
    recentActivity,
  ] = await Promise.all([
    prisma.patientProfile.count(),
    prisma.labResult.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    }),
    prisma.message.count({ where: { isRead: false } }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } }, patient: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of patients, labs, orders, and activity"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Patients" value={patientCount} icon={Users} />
        <StatCard label="Pending Labs" value={pendingLabs} icon={FlaskConical} />
        <StatCard label="Active Orders" value={activeOrders} icon={ShoppingBag} />
        <StatCard label="Upcoming Appts" value={upcomingAppointments} icon={Calendar} />
        <StatCard label="Unread Messages" value={unreadMessages} icon={MessageSquare} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/admin/patients", label: "Manage Patients" },
              { href: "/admin/labs", label: "Review Lab Results" },
              { href: "/admin/orders", label: "View Orders" },
              { href: "/admin/appointments", label: "Schedule Appointments" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/admin/activity" className="text-sm text-teal-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((log) => (
                  <li key={log.id} className="text-sm">
                    <span className="font-medium text-slate-900">
                      {log.actor?.name ?? "System"}
                    </span>{" "}
                    <span className="text-slate-600">{log.action.replace(/_/g, " ").toLowerCase()}</span>
                    {log.patient?.user?.name && (
                      <span className="text-slate-500"> — {log.patient.user.name}</span>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(log.createdAt)}</p>
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
