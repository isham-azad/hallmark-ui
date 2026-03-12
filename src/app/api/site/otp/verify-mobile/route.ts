import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
        }

        const verificationDoc = await db.collection("phoneVerifications").doc(phone).get();

        if (!verificationDoc.exists) {
            return NextResponse.json({ error: "No OTP found for this number" }, { status: 401 });
        }

        const verificationData = verificationDoc.data();
        if (!verificationData) {
            return NextResponse.json({ error: "No OTP found for this number" }, { status: 401 });
        }

        if (verificationData.otp !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
        }

        const otpExpiry = verificationData.otpExpiry?.toDate?.() ?? new Date(verificationData.otpExpiry);
        if (otpExpiry < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
        }

        // Clean up verification
        await db.collection("phoneVerifications").doc(phone).delete();

        // Check if customer exists
        const customerSnap = await db.collection("customers").where("phone", "==", phone).limit(1).get();
        let customerData = null;
        if (!customerSnap.empty) {
            customerData = customerSnap.docs[0].data();
            // Remove phone from customerData to avoid redundancy if needed, or keep it
        }

        return NextResponse.json({
            success: true,
            customerData
        });
    } catch (error) {
        console.error("Verify Mobile OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
