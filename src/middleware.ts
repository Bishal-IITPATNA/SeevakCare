import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/appointments",
  "/api/prescriptions",
  "/api/medicine-orders",
  "/api/lab-bookings",
  "/api/payments",
  "/api/admin",
  "/api/notifications",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/change-password",
  "/api/lab-store",
  "/api/hospital-admin",
  "/api/patients",
  "/api/doctors/profile",
  "/api/doctors/chambers",
  "/api/prescription-bills",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token =
    req.cookies.get("session_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
