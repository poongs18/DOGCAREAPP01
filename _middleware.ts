import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { RBAC_RULES } from "@/lib/rbac-rules";
import { Role } from "@/lib/rbac";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public APIs (NO AUTH)
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/refresh",
    "/api/system/health",
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  // Verify JWT
  let payload: any;
  try {
    payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const userRole = payload.role as Role;

  // Find RBAC rule for this path
  const matchedRule = Object.entries(RBAC_RULES).find(
    ([route]) => pathname.startsWith(route)
  );

  // If route is protected but no rule found → deny
  if (!matchedRule) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  const [, allowedRoles] = matchedRule;

  // Role check
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // Passed RBAC
  return NextResponse.next();
}
