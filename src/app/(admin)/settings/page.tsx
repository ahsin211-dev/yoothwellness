import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { Shield, Database, Key } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Account and platform configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Full name
              </p>
              <p className="font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Email
              </p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Role
              </p>
              <Badge variant="default">{user?.role}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Status
              </p>
              <Badge variant={user?.isActive ? "success" : "secondary"}>
                {user?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Last login: {formatDateTime(user?.lastLoginAt)}</p>
            <p>Account created: {formatDateTime(user?.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            Integrations
          </CardTitle>
          <CardDescription>Connected platform services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div>
              <p className="font-medium text-sm">Stripe Payments</p>
              <p className="text-xs text-muted-foreground">Payment links and checkout</p>
            </div>
            <Badge variant={process.env.STRIPE_SECRET_KEY ? "success" : "secondary"}>
              {process.env.STRIPE_SECRET_KEY ? "Configured" : "Not configured"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border">
            <div>
              <p className="font-medium text-sm">File Storage</p>
              <p className="text-xs text-muted-foreground">
                {process.env.STORAGE_PROVIDER ?? "supabase"} backend
              </p>
            </div>
            <Badge variant="secondary">
              {process.env.STORAGE_PROVIDER ?? "supabase"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Platform Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Yooth Wellness Platform</p>
          <p>Version 0.1.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
