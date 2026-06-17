import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password"];

const adminRoutes = ["/admin"];
const portalRoutes = ["/portal"];

export default auth(async function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect already-authenticated users away from auth pages
    if (session) {
      const role = session.user?.role;
      if (role === "ADMIN" || role === "CLINICIAN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // All other routes require auth
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Protect admin routes
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "ADMIN" && role !== "CLINICIAN") {
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }
  }

  // Protect portal routes — patients only (admins can also access for testing)
  if (portalRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "PATIENT") {
      // Admins visiting portal paths get redirected to admin
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
