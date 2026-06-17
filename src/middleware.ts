import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/auth")
  );
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isUploadRoute = pathname.startsWith("/api/uploads/");

  if (isUploadRoute && isLoggedIn) return NextResponse.next();
  if (isApiRoute && !pathname.startsWith("/api/auth")) return NextResponse.next();

  if (isAuthRoute && isLoggedIn) {
    const redirectUrl = role === "PATIENT" ? "/portal" : "/admin";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  if (!isPublic && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role === "PATIENT") {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  if (pathname.startsWith("/portal") && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
