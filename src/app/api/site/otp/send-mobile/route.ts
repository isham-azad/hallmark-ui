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

        const verificationRef = db.collection("phoneVerifications").doc(phone);
        const verificationDoc = await verificationRef.get();
        const verificationData = verificationDoc.data();

        if (verificationData) {
            const lastRequested = verificationData.updatedAt?.toDate?.() || new Date(0);
            const secondsSinceLast = (Date.now() - lastRequested.getTime()) / 1000;
            if (secondsSinceLast < 60) {
                return NextResponse.json({ 
                    error: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting again.` 
                }, { status: 429 });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in phoneVerifications collection
        await verificationRef.set({
            otp,
            otpExpiry,
            updatedAt: new Date(),
            attempts: 0
        });

        console.log(`[AUTH] Generating mobile checkout OTP for ${phone}: ${otp}`);

        const smsSent = await sendSmsOtp(phone, otp);

        if (!smsSent) {
            // for testing purpose need to show the OTP in the OTP screen
            return NextResponse.json({ error: "Failed to send OTP SMS", otp }, { status: 500 });
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
