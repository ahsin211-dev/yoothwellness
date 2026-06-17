"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface TopbarProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  role: string;
  title?: string;
  unreadCount?: number;
}

export function Topbar({
  userName,
  userEmail,
  userImage,
  role,
  title,
  unreadCount = 0,
}: TopbarProps) {
  const settingsHref = role === "PATIENT" ? "/portal/profile" : "/admin/settings";
  const messagesHref = role === "PATIENT" ? "/portal/messages" : "/admin/messages";

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9 w-64 h-9 text-sm"
            />
          </div>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href={messagesHref}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Messages</span>
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userImage ?? undefined} alt={userName ?? ""} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={settingsHref}>Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
