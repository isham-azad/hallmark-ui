import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "hallmark-admin-secret-key-change-me-in-production"
);

export const COOKIE_NAME = "admin_session";

interface SessionPayload {
    email: string;
    role: string;
    name: string;
}

export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(SECRET);

    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });

    return token;
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
}

/**
 * Returns the current admin session or null if not authenticated.
 * Used in API routes to protect endpoints.
 */
export async function getAdminSession() {
    return getSession();
}

/**
 * Creates an audit log entry for admin actions.
 */
export async function logAction(
    adminEmail: string,
    adminName: string,
    action: string,
    details: any = {}
) {
    try {
        const { default: db } = await import("@/lib/firebase");
        await db.collection("auditLogs").add({
            adminEmail,
            adminName,
            action,
            details,
            timestamp: new Date().toISOString(), // Using ISO string for easier sorting/parsing
        });
    } catch (error) {
        console.error("Audit Logging Error:", error);
    }
}

export async function deleteSession() {
    (await cookies()).delete(COOKIE_NAME);
}
