export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { createSession, verifyPassword } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
    try {
        // ── Rate limiting ─────────────────────────────────────────────────────
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

        const body = await request.json();
        const { email, password } = body;

        // Key on IP + email so each (attacker IP, target account) pair is tracked separately.
        const rateLimitKey = `admin-login:${ip}:${(email ?? "").trim().toLowerCase()}`;
        const rateLimit = checkRateLimit(rateLimitKey, {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000,       // 5 attempts per 15 minutes
            blockDurationMs: 30 * 60 * 1000, // blocked for 30 minutes after
        });

        if (!rateLimit.allowed) {
            const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
            return NextResponse.json(
                { error: "Too many login attempts. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(retryAfterSec),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const adminsSnap = await db.collection("admins").where("email", "==", email.trim().toLowerCase()).limit(1).get();

        if (adminsSnap.empty) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const adminDoc = adminsSnap.docs[0];
        const adminData = adminDoc.data();

        // Check password using bcrypt.
        let isAuthorized = false;
        if (adminData.passwordHash) {
            isAuthorized = await verifyPassword(password, adminData.passwordHash);
        } else {
            // SECURITY: No fallback — accounts without a hash are denied access.
            console.warn(`[SECURITY] Admin login attempted for account without passwordHash: ${email}`);
            isAuthorized = false;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const admin = {
            email: adminData.email,
            name: adminData.name || "Admin",
            role: adminData.role || "editor"
        };

        // Successful login — clear the rate limit for this key.
        resetRateLimit(rateLimitKey);

        // Create secure HTTP-only cookie
        await createSession(admin);

        return NextResponse.json({
            success: true,
            admin
        });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
