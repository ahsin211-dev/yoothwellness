import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminMessagesPage() {
  await requireStaff();

  const messages = await prisma.message.findMany({
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      patient: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="Messages" description="Secure patient communications" />

      <DataTable headers={["Patient", "From", "To", "Subject", "Read", "Date"]}>
        {messages.map((msg) => (
          <tr key={msg.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <Link href={`/admin/patients/${msg.patientId}`} className="font-medium text-teal-600 hover:underline">
                {msg.patient.user.name}
              </Link>
            </td>
            <td className="px-4 py-3">{msg.from.name}</td>
            <td className="px-4 py-3">{msg.to.name}</td>
            <td className="px-4 py-3">{msg.subject}</td>
            <td className="px-4 py-3">
              <Badge variant={msg.isRead ? "secondary" : "info"}>
                {msg.isRead ? "Read" : "Unread"}
              </Badge>
            </td>
            <td className="px-4 py-3 text-slate-500">{formatDate(msg.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
