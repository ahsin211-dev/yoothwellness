import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { prisma } from "@/lib/prisma";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "PATIENT") redirect("/admin/dashboard");

  // Count unread messages for badge
  const unreadCount = await prisma.message.count({
    where: {
      toUserId: session.user.id,
      status: "UNREAD",
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role="PATIENT"
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          role={session.user.role}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
