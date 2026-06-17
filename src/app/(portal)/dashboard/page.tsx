import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  FlaskConical,
  MessageSquare,
  Calendar,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "My Dashboard" };

async function getPortalData(userId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!patient) return null;

  const [
    recentLabs,
    activePlans,
    recentOrders,
    pendingConsents,
    unreadMessages,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.labResult.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.treatmentPlan.findMany({
      where: { patientId: patient.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.consentForm.count({
      where: { patientId: patient.id, status: "PENDING" },
    }),
    prisma.message.count({
      where: { toUserId: userId, status: "UNREAD" },
    }),
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        appointmentDate: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      orderBy: { appointmentDate: "asc" },
      take: 3,
    }),
  ]);

  return {
    patient,
    recentLabs,
    activePlans,
    recentOrders,
    pendingConsents,
    unreadMessages,
    upcomingAppointments,
  };
}

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getPortalData(session.user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-muted-foreground">
          Your patient profile is being set up. Please contact your care team.
        </p>
      </div>
    );
  }

  const { patient, recentLabs, activePlans, recentOrders, pendingConsents, unreadMessages, upcomingAppointments } = data;

  const alerts = [
    pendingConsents > 0 && {
      icon: FileText,
      message: `${pendingConsents} consent form${pendingConsents !== 1 ? "s" : ""} require your signature`,
      href: "/portal/documents",
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
    },
    unreadMessages > 0 && {
      icon: MessageSquare,
      message: `${unreadMessages} unread message${unreadMessages !== 1 ? "s" : ""} from your care team`,
      href: "/portal/messages",
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
    recentLabs.some((l) => l.flagged) && {
      icon: FlaskConical,
      message: "Some of your recent lab results have been flagged for review",
      href: "/portal/labs",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    message: string;
    href: string;
    color: string;
    bg: string;
  }>;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back, {patient.user.name?.split(" ")[0] ?? "there"}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s a summary of your health journey.
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.href}>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border ${alert.bg} hover:opacity-90 transition-opacity`}
              >
                <alert.icon className={`w-5 h-5 ${alert.color} shrink-0`} />
                <p className={`text-sm font-medium ${alert.color}`}>
                  {alert.message}
                </p>
                <ArrowRight className={`w-4 h-4 ml-auto ${alert.color} shrink-0`} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Lab Results</CardTitle>
              <CardDescription>Your recent test results</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/labs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLabs.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No lab results yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-primary/10 shrink-0">
                        <FlaskConical className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{lab.testName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(lab.collectedAt ?? lab.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lab.flagged && <Badge variant="destructive">Flagged</Badge>}
                      <Badge
                        variant={
                          lab.status === "REVIEWED" ? "success" :
                          lab.status === "FLAGGED" ? "destructive" :
                          "secondary"
                        }
                      >
                        {lab.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Treatment Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Treatment Plans</CardTitle>
              <CardDescription>Your current care protocols</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/treatment-plans">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activePlans.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No active treatment plans
              </div>
            ) : (
              <div className="space-y-3">
                {activePlans.map((plan) => (
                  <div key={plan.id} className="p-3 rounded-md border space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{plan.title}</p>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.items.length} recommendations
                      {plan.startDate && ` · Started ${formatDate(plan.startDate)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Orders</CardTitle>
              <CardDescription>Your supplement & product orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No orders placed yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/portal/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">
                        {formatCurrency(order.total)}
                      </p>
                      <Badge
                        variant={
                          order.status === "DELIVERED" ? "success" :
                          order.status === "CANCELLED" ? "destructive" :
                          order.status === "PENDING_PAYMENT" ? "warning" :
                          "secondary"
                        }
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Appointments</CardTitle>
              <CardDescription>Your upcoming visits</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/appointments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.isVirtual ? "Virtual" : apt.location ?? "In-person"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {formatDate(apt.appointmentDate, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.appointmentDate).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
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
