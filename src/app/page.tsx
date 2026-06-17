import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart,
  FlaskConical,
  ClipboardList,
  Shield,
  Calendar,
  MessageSquare,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
              Y
            </div>
            <span className="text-lg font-semibold text-slate-900">Yooth Wellness</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Personalized Wellness,
            <br />
            <span className="text-teal-600">Delivered with Care</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Yooth Wellness connects you with clinical experts, lab insights, treatment
            plans, and wellness products — all in one secure platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Create patient account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in to portal</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Everything you need for your wellness journey
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FlaskConical,
                title: "Lab Tracking",
                description: "Upload and review lab results with your care team.",
              },
              {
                icon: ClipboardList,
                title: "Treatment Plans",
                description: "Personalized protocols and clinical recommendations.",
              },
              {
                icon: Heart,
                title: "Product Recommendations",
                description: "Curated wellness products matched to your plan.",
              },
              {
                icon: Shield,
                title: "Secure Consents",
                description: "Digital consent forms with full audit trail.",
              },
              {
                icon: Calendar,
                title: "Scheduling",
                description: "Book and manage appointments with providers.",
              },
              {
                icon: MessageSquare,
                title: "Messaging",
                description: "Secure communication with your care team.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <feature.icon className="h-8 w-8 text-teal-600" />
                <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Yooth Wellness. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
