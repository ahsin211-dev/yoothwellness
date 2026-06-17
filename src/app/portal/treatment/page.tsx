import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export default async function PortalTreatmentPage() {
  const user = await requirePatient();
  const profile = await getPatientProfileForUser(user.id);
  if (!profile) return null;

  const [plans, recommendations] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: "desc" },
      include: { recommendations: { include: { products: { include: { product: true } } } } },
    }),
    prisma.clinicalRecommendation.findMany({
      where: { patientId: profile.id, isActive: true },
      include: { products: { include: { product: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Treatment Plans" description="Your personalized treatment plans and recommendations" />

      <div className="space-y-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.title}</CardTitle>
                <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>{plan.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.description && <p className="text-sm text-slate-600">{plan.description}</p>}
              {plan.goals && <p className="text-sm"><span className="font-medium">Goals:</span> {plan.goals}</p>}
              <p className="text-xs text-slate-500">
                {formatDateShort(plan.startDate)} — {formatDateShort(plan.endDate)}
              </p>
              {plan.recommendations.length > 0 && (
                <ul className="space-y-2 border-t border-slate-100 pt-4">
                  {plan.recommendations.map((rec) => (
                    <li key={rec.id} className="text-sm">
                      <p className="font-medium">{rec.title}</p>
                      {rec.description && <p className="text-slate-600">{rec.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}

        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec) => (
                  <li key={rec.id} className="rounded-lg border border-slate-100 p-4">
                    <p className="font-medium">{rec.title}</p>
                    {rec.description && <p className="mt-1 text-sm text-slate-600">{rec.description}</p>}
                    {rec.products.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-500">
                        {rec.products.map((rp) => (
                          <li key={rp.id}>
                            {rp.product.name}
                            {rp.dosage && ` — ${rp.dosage}`}
                            {rp.instructions && ` (${rp.instructions})`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {plans.length === 0 && recommendations.length === 0 && (
          <p className="text-center text-sm text-slate-500">No treatment plans assigned yet</p>
        )}
      </div>
    </div>
  );
}
