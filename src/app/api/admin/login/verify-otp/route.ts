export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
        }

        const adminsSnap = await db.collection("admins").where("email", "==", email).limit(1).get();

        if (adminsSnap.empty) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
        }

        const adminDoc = adminsSnap.docs[0];
        const adminData = adminDoc.data();

        // Check for too many failed attempts (max 5)
        const attempts = adminData.otpAttempts || 0;
        if (attempts >= 5) {
            // Check if they should be locked out or just need a new OTP
            return NextResponse.json({ 
                error: "Too many failed attempts. Please request a new OTP." 
            }, { status: 401 });
        }

        if (adminData.otp !== otp) {
            // Increment attempts
            await adminDoc.ref.update({
                otpAttempts: attempts + 1
            });
            return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
        }

        const otpExpiry = adminData.otpExpiry?.toDate?.() ?? new Date(adminData.otpExpiry);
        if (otpExpiry < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
        }

        await adminDoc.ref.update({
            otp: null,
            otpExpiry: null,
            otpAttempts: 0,
            otpRequestedAt: null,
        });

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
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
