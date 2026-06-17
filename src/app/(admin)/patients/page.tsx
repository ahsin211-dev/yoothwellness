import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import { UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export const metadata: Metadata = { title: "Patients" };

async function getPatients(search?: string) {
  return prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          labResults: true,
          orders: true,
          treatmentPlans: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const patients = await getPatients(searchParams.search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patients</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/patients/new">
            <UserPlus className="w-4 h-4" />
            Add patient
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <form>
          <Input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search patients…"
            className="pl-9"
          />
        </form>
      </div>

      {/* Patient list */}
      <div className="grid gap-4">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
              No patients found.
            </CardContent>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={patient.user.image ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(patient.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{patient.user.name ?? "—"}</h3>
                      <Badge variant={patient.user.isActive ? "success" : "secondary"}>
                        {patient.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.user.email}</p>
                    {patient.user.phone && (
                      <p className="text-sm text-muted-foreground">{patient.user.phone}</p>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-lg font-semibold">{patient._count.labResults}</p>
                      <p className="text-xs text-muted-foreground">Labs</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{patient._count.treatmentPlans}</p>
                      <p className="text-xs text-muted-foreground">Plans</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{patient._count.orders}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(patient.user.createdAt)}
                    </p>
                    {patient.user.lastLoginAt && (
                      <p className="text-xs text-muted-foreground">
                        Last seen {formatDate(patient.user.lastLoginAt)}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/patients/${patient.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
