"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ShoppingCart,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  Heart,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  role: "ADMIN" | "CLINICIAN" | "PATIENT";
  userName?: string | null;
  userEmail?: string | null;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Lab Results", href: "/admin/labs", icon: FlaskConical },
  { label: "Treatment Plans", href: "/admin/treatment-plans", icon: ClipboardList },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const portalNav: NavItem[] = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/portal/profile", icon: Heart },
  { label: "Lab Results", href: "/portal/labs", icon: FlaskConical },
  { label: "Treatment Plan", href: "/portal/treatment-plans", icon: ClipboardList },
  { label: "Orders", href: "/portal/orders", icon: ShoppingCart },
  { label: "Documents", href: "/portal/documents", icon: FileText },
  { label: "Messages", href: "/portal/messages", icon: MessageSquare },
  { label: "Appointments", href: "/portal/appointments", icon: Calendar },
];

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const nav = role === "PATIENT" ? portalNav : adminNav;

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / brand */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm whitespace-nowrap">
              Yooth Wellness
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {nav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              item.href !== "/portal/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="shrink-0 w-5 h-5" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium truncate">{userName ?? "User"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm hover:bg-accent"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
