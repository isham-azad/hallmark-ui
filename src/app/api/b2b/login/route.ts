import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { createB2BSession } from "@/lib/b2b-auth";
import { verifyPassword } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";
import { z } from "zod";

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        // ── Rate limiting ─────────────────────────────────────────────────────
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

        const body = await req.json();
        const validation = LoginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 400 }
            );
        }

        const { username, password } = validation.data;

        const rateLimitKey = `b2b-login:${ip}:${username.trim().toLowerCase()}`;
        const rateLimit = checkRateLimit(rateLimitKey, {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000,
            blockDurationMs: 30 * 60 * 1000,
        });

        if (!rateLimit.allowed) {
            const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
            return NextResponse.json(
                { success: false, error: "Too many login attempts. Please try again later." },
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
        
        // Find user by username
        const snapshot = await db.collection("b2b_clients").where("username", "==", username.trim()).get();
        if (snapshot.empty) {
            return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
        }

        const clientDoc = snapshot.docs[0];
        const clientData = clientDoc.data();

        if (clientData.status === "disabled") {
            return NextResponse.json({ success: false, error: "Your account is disabled. Contact admin." }, { status: 403 });
        }

        const isValid = await verifyPassword(password, clientData.passwordHash);
        if (!isValid) {
            return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
        }

        // Credentials match — clear rate limit and create session.
        resetRateLimit(rateLimitKey);
        await createB2BSession({
            id: clientDoc.id,
            username: clientData.username,
            companyName: clientData.companyName,
        });

        return NextResponse.json({ success: true, companyName: clientData.companyName });

    } catch (error) {
        console.error("B2B Login error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
