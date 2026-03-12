import { NextResponse } from "next/server";
import db from "@/lib/firebase";

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

        if (adminData.otp !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
        }

        const otpExpiry = adminData.otpExpiry?.toDate?.() ?? new Date(adminData.otpExpiry);
        if (otpExpiry < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
        }

        await adminDoc.ref.update({
            otp: null,
            otpExpiry: null,
        });

        return NextResponse.json({
            success: true,
            admin: {
                email: adminData.email,
                name: adminData.name || "Admin",
                role: adminData.role || "editor" // Default to editor if not set
            }
        });
    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
