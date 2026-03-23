import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { createB2BSession } from "@/lib/b2b-auth";
import crypto from "crypto";
import { z } from "zod";

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

function hashPassword(password: string) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = LoginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid username or password" },
                { status: 400 }
            );
        }

        const { username, password } = validation.data;
        
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

        const hashedPassword = hashPassword(password);
        if (clientData.passwordHash !== hashedPassword) {
            return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
        }

        // Credentials match, create session
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
