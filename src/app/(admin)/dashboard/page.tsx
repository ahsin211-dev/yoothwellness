import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Users,
  FlaskConical,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPatients,
    activePatients,
    newPatientsThisMonth,
    pendingLabs,
    flaggedLabs,
    pendingOrders,
    paidOrdersTotal,
    recentActivity,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.user.count({ where: { role: "PATIENT", isActive: true } }),
    prisma.user.count({
      where: { role: "PATIENT", createdAt: { gte: startOfMonth } },
    }),
    prisma.labResult.count({ where: { status: "PENDING" } }),
    prisma.labResult.count({ where: { flagged: true, status: { not: "ARCHIVED" } } }),
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PROCESSING"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      orderBy: { appointmentDate: "asc" },
      take: 5,
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    totalPatients,
    activePatients,
    newPatientsThisMonth,
    pendingLabs,
    flaggedLabs,
    pendingOrders,
    totalRevenue: paidOrdersTotal._sum.total ?? 0,
    recentActivity,
    upcomingAppointments,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      sub: `${stats.newPatientsThisMonth} new this month`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/patients",
    },
    {
      title: "Pending Lab Reviews",
      value: stats.pendingLabs,
      sub: stats.flaggedLabs > 0 ? `${stats.flaggedLabs} flagged` : "All clear",
      icon: FlaskConical,
      color: stats.pendingLabs > 0 ? "text-amber-600" : "text-green-600",
      bg: stats.pendingLabs > 0 ? "bg-amber-50" : "bg-green-50",
      href: "/admin/labs",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      sub: "Awaiting payment or processing",
      icon: ShoppingCart,
      color: stats.pendingOrders > 0 ? "text-orange-600" : "text-green-600",
      bg: stats.pendingOrders > 0 ? "bg-orange-50" : "bg-green-50",
      href: "/admin/orders",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      sub: "All-time paid orders",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/orders",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Good morning, {session?.user.name?.split(" ")[0] ?? "Admin"}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your patients today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Appointments</CardTitle>
              <CardDescription>Next scheduled visits</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/patients">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.upcomingAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {apt.patient.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {formatDateTime(apt.appointmentDate)}
                      </p>
                      <Badge
                        variant={apt.isVirtual ? "info" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {apt.isVirtual ? "Virtual" : "In-person"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-muted mt-0.5">
                      <AlertCircle className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {log.user.name ?? log.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.description}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
