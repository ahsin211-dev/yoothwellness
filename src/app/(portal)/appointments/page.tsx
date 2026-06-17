import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Video, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Appointments" };

export default async function PortalAppointmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Patient profile not found.
      </div>
    );
  }

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        appointmentDate: { gte: now },
        status: { not: "CANCELLED" },
      },
      orderBy: { appointmentDate: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        OR: [
          { appointmentDate: { lt: now } },
          { status: "CANCELLED" },
        ],
      },
      orderBy: { appointmentDate: "desc" },
      take: 10,
    }),
  ]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "CANCELLED": return "destructive";
      case "CONFIRMED": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Appointments</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your scheduled visits with the care team
        </p>
      </div>

      {/* Upcoming */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Upcoming</h3>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32 gap-3">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                No upcoming appointments
              </p>
            </CardContent>
          </Card>
        ) : (
          upcoming.map((apt) => (
            <Card key={apt.id} className="border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">{apt.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(apt.appointmentDate)} · {apt.duration} min
                        </span>
                        {apt.isVirtual ? (
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            Virtual
                          </span>
                        ) : apt.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {apt.location}
                          </span>
                        ) : null}
                      </div>
                      {apt.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={statusVariant(apt.status) as "success" | "destructive" | "default" | "secondary"}>
                      {apt.status}
                    </Badge>
                    {apt.isVirtual && apt.meetingUrl && (
                      <Button size="sm" asChild>
                        <a href={apt.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="w-3.5 h-3.5" />
                          Join
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Past</h3>
          {past.map((apt) => (
            <Card key={apt.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{apt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(apt.appointmentDate)} ·{" "}
                      {apt.isVirtual ? "Virtual" : apt.location ?? "In-person"}
                    </p>
                  </div>
                  <Badge variant={statusVariant(apt.status) as "success" | "destructive" | "default" | "secondary"}>
                    {apt.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
