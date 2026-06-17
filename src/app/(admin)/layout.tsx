import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role === "PATIENT") redirect("/portal/dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={session.user.role as "ADMIN" | "CLINICIAN"}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          role={session.user.role}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
