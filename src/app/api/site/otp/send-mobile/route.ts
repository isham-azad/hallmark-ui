export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { sendSmsOtp } from "@/lib/sms";

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in phoneVerifications collection
        await db.collection("phoneVerifications").doc(phone).set({
            otp,
            otpExpiry,
            updatedAt: new Date()
        });

        console.log(`[AUTH] Generating mobile checkout OTP for ${phone}: ${otp}`);

        const smsSent = await sendSmsOtp(phone, otp);

        if (!smsSent) {
            return NextResponse.json({ error: "Failed to send OTP SMS" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("Send Mobile OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
