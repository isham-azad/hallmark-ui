import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const b2bJwtSecret = process.env.B2B_JWT_SECRET;
if (!b2bJwtSecret) throw new Error("[SECURITY] B2B_JWT_SECRET environment variable is not set.");

const SECRET = new TextEncoder().encode(b2bJwtSecret);

export const B2B_COOKIE_NAME = "b2b_session";

interface B2BSessionPayload {
    id: string;
    username: string;
    companyName: string;
}

export async function createB2BSession(payload: B2BSessionPayload) {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d") // 7 days
        .sign(SECRET);

    (await cookies()).set(B2B_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });

    return token;
}

export async function verifyB2BSession(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as B2BSessionPayload;
    } catch (error) {
        return null;
    }
}

export async function getB2BSession() {
    const token = (await cookies()).get(B2B_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyB2BSession(token);
}

export async function deleteB2BSession() {
    (await cookies()).delete(B2B_COOKIE_NAME);
}
