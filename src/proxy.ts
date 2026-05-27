import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isPatientRoute = pathname.startsWith("/patient");
  const isDoctorRoute = pathname.startsWith("/doctor");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Redirect unauthenticated users away from protected routes
  if ((isPatientRoute || isDoctorRoute) && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent cross-role access
  if (isPatientRoute && token?.role !== "patient") {
    return NextResponse.redirect(new URL("/doctor/dashboard", req.url));
  }
  if (isDoctorRoute && token?.role !== "doctor") {
    return NextResponse.redirect(new URL("/patient/dashboard", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    const dest = token.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/login", "/register"],
};
