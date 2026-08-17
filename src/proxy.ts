import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("[SECURITY] JWT_SECRET environment variable is not set.");

const SECRET = new TextEncoder().encode(jwtSecret);

const COOKIE_NAME = "admin_session";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin routes
    if (pathname.startsWith("/admin")) {
        // Allow /admin/login to be accessed without session
        if (pathname === "/admin/login") {
            return NextResponse.next();
        }

        const token = request.cookies.get(COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        try {
            await jwtVerify(token, SECRET);
            return NextResponse.next();
        } catch (error) {
            // Invalid token
            const response = NextResponse.redirect(new URL("/admin/login", request.url));
            response.cookies.delete(COOKIE_NAME);
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
