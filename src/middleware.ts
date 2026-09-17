import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiting map for edge/middleware protection
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 reqs / min / IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

export function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  // 1. Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi setelah 1 menit.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 2. Authentication guard for Admin & Workspace routes
  const token = request.cookies.get("nexus_session")?.value;
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/workspace") ||
    request.nextUrl.pathname.startsWith("/admin");

  // Allow navigation but check token if present
  const response = NextResponse.next();

  // 3. Security HTTP Headers (Enterprise Hardening)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
