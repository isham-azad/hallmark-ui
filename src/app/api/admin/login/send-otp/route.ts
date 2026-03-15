export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { sendSmsOtp } from "@/lib/sms";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const adminsSnap = await db.collection("admins").where("email", "==", email).limit(1).get();

        if (adminsSnap.empty) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminDoc = adminsSnap.docs[0];

        const adminData = adminDoc.data();
        const phone = adminData.phone;

        if (!phone) {
            return NextResponse.json({ error: "No mobile number registered for this admin" }, { status: 400 });
        }

        // Rate limiting: 60 seconds between OTP requests
        const lastRequested = adminData.otpRequestedAt?.toDate?.() || new Date(0);
        const secondsSinceLast = (Date.now() - lastRequested.getTime()) / 1000;
        if (secondsSinceLast < 60) {
            return NextResponse.json({ 
                error: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting again.` 
            }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await adminDoc.ref.update({
            otp,
            otpExpiry,
            otpRequestedAt: new Date(),
            otpAttempts: 0, // Reset attempts for the new OTP
        });

        console.log(`[AUTH] Generating OTP ${otp} for ${email} (${phone})`);

        const smsSent = await sendSmsOtp(phone, otp);

        if (!smsSent) {
            return NextResponse.json({ error: "Failed to send OTP SMS" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
