import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-slate-600">
        You don&apos;t have permission to view this page.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
