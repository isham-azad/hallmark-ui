import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
    process.env.B2B_JWT_SECRET || "hallmark-b2b-secret-key-change-me-in-production"
);

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
        .setExpirationTime("30d") // 30 days
        .sign(SECRET);

    (await cookies()).set(B2B_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
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
