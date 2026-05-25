export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { createSession } from "@/lib/auth";

import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const adminsSnap = await db.collection("admins").where("email", "==", email.trim().toLowerCase()).limit(1).get();

        if (adminsSnap.empty) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const adminDoc = adminsSnap.docs[0];
        const adminData = adminDoc.data();

        // Check password.
        let isAuthorized = false;
        if (adminData.passwordHash) {
            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
            isAuthorized = adminData.passwordHash === hashedPassword;
        } else {
            // Fallback for admins without a password setup yet
            const tempPassword = process.env.ADMIN_PASSWORD || "HallmarkAdmin2026!";
            isAuthorized = password === tempPassword;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const admin = {
            email: adminData.email,
            name: adminData.name || "Admin",
            role: adminData.role || "editor"
        };

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
