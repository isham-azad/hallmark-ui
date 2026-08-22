import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("[SECURITY] JWT_SECRET environment variable is not set.");

const SECRET = new TextEncoder().encode(jwtSecret);
const COOKIE_NAME = "admin_session";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let response = NextResponse.next();

    // 1. Admin Authentication Check
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        try {
            await jwtVerify(token, SECRET);
        } catch (error) {
            const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
            redirectResponse.cookies.delete(COOKIE_NAME);
            return redirectResponse;
        }
    }

    // 2. Content Security Policy Generation
    // Only apply to HTML pages, not API routes or static assets
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.match(/\.(ico|xml|txt)$/)) {
        const nonce = crypto.randomUUID();

        const cspHeader = `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;
          style-src 'self' 'unsafe-inline' data: blob: https:;
          font-src 'self' data: https:;
          img-src 'self' data: blob: https:;
          connect-src 'self' https: ws: wss:;
          frame-src 'self' https:;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
        `.replace(/\s{2,}/g, " ").trim();

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-nonce", nonce);
        
        // Only enforce CSP in production for now to avoid breaking local Turbopack HMR
        if (process.env.NODE_ENV === 'production') {
            requestHeaders.set("Content-Security-Policy", cspHeader);
        }

        response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
        
        if (process.env.NODE_ENV === 'production') {
            response.headers.set("Content-Security-Policy", cspHeader);
        }
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
