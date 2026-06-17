import { requireStaff } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PageHeader, DataTable } from "@/components/ui/page-elements";
import { formatDate } from "@/lib/utils";

export default async function AdminActivityPage() {
  await requireStaff();

  const logs = await prisma.activityLog.findMany({
    include: {
      actor: { select: { name: true, email: true } },
      patient: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Activity Log" description="Audit trail of platform actions" />

      <DataTable headers={["Actor", "Action", "Entity", "Patient", "Date"]}>
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <div>
                <p className="font-medium">{log.actor?.name ?? "System"}</p>
                {log.actor?.email && <p className="text-xs text-slate-500">{log.actor.email}</p>}
              </div>
            </td>
            <td className="px-4 py-3">{log.action.replace(/_/g, " ")}</td>
            <td className="px-4 py-3 text-slate-600">
              {log.entityType ? `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}` : "—"}
            </td>
            <td className="px-4 py-3">{log.patient?.user?.name ?? "—"}</td>
            <td className="px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
