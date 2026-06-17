import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = { title: "Treatment Plans" };

const CATEGORY_COLORS: Record<string, string> = {
  Supplement: "bg-green-100 text-green-800",
  Medication: "bg-blue-100 text-blue-800",
  Lifestyle: "bg-purple-100 text-purple-800",
  "Lab Test": "bg-amber-100 text-amber-800",
  Exercise: "bg-orange-100 text-orange-800",
  Nutrition: "bg-teal-100 text-teal-800",
};

export default async function PortalTreatmentPlansPage() {
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

  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId: patient.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  const activePlans = plans.filter((p) => p.status === "ACTIVE");
  const otherPlans = plans.filter((p) => p.status !== "ACTIVE");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Treatment Plans</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your personalized care protocols from your clinical team
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <ClipboardList className="w-10 h-10 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No treatment plans yet</p>
              <p className="text-sm text-muted-foreground">
                Your care team will create your personalized plan after your consultation
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active plans */}
          {activePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}

          {/* Other plans */}
          {otherPlans.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-muted-foreground">
                Previous Plans
              </h3>
              {otherPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} dimmed />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  dimmed = false,
}: {
  plan: {
    id: string;
    title: string;
    description: string | null;
    goals: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    items: Array<{
      id: string;
      category: string;
      name: string;
      description: string | null;
      dosage: string | null;
      frequency: string | null;
      duration: string | null;
      instructions: string | null;
    }>;
  };
  dimmed?: boolean;
}) {
  const grouped = plan.items.reduce<Record<string, typeof plan.items>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <Card className={dimmed ? "opacity-70" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{plan.title}</CardTitle>
            {plan.description && (
              <CardDescription className="mt-1">{plan.description}</CardDescription>
            )}
          </div>
          <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>
            {plan.status}
          </Badge>
        </div>
        {(plan.startDate || plan.endDate) && (
          <p className="text-xs text-muted-foreground mt-2">
            {plan.startDate && `Started ${formatDate(plan.startDate)}`}
            {plan.startDate && plan.endDate && " · "}
            {plan.endDate && `Ends ${formatDate(plan.endDate)}`}
          </p>
        )}
        {plan.goals && (
          <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Goals
            </p>
            <p className="text-sm text-foreground">{plan.goals}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800"
                }`}
              >
                {category}
              </span>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md border bg-muted/30 space-y-2"
                >
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {item.dosage && (
                      <span>
                        <span className="font-medium text-foreground">Dosage:</span>{" "}
                        {item.dosage}
                      </span>
                    )}
                    {item.frequency && (
                      <span>
                        <span className="font-medium text-foreground">Frequency:</span>{" "}
                        {item.frequency}
                      </span>
                    )}
                    {item.duration && (
                      <span>
                        <span className="font-medium text-foreground">Duration:</span>{" "}
                        {item.duration}
                      </span>
                    )}
                  </div>
                  {item.instructions && (
                    <div className="p-2 rounded bg-background text-xs text-muted-foreground border">
                      {item.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
