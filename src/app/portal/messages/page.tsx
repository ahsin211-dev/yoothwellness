import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MessageForm } from "@/components/portal/message-form";

export default async function PortalMessagesPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const messages = await prisma.message.findMany({
    where: { patientId: profile.id },
    include: {
      from: { select: { name: true, role: true } },
      to: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "CLINICIAN"] }, isActive: true },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="Messages" description="Secure messaging with your care team" />

      <div className="mb-8">
        <MessageForm staffUsers={staffUsers} />
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.id} className={!msg.isRead && msg.toId === user.id ? "border-teal-200" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{msg.subject}</CardTitle>
                <span className="text-xs text-slate-500">{formatDate(msg.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-slate-500">
                From: {msg.from.name} → To: {msg.to.name}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.body}</p>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">No messages yet</p>
        )}
      </div>
    </div>
  );
}
