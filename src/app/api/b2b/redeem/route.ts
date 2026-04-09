import { NextRequest, NextResponse } from "next/server";
import { getB2BSession } from "@/lib/b2b-auth";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getB2BSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { amount, method, details } = body;

        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return NextResponse.json({ success: false, error: "Invalid amount." }, { status: 400 });
        }

        const isProduction = process.env.NODE_ENV === "production";
        const minBank = isProduction ? 1000 : 1;
        const minVoucher = isProduction ? 10 : 1;
        const currentMin = method === "gift_voucher" ? minVoucher : minBank;

        if (amountNum < currentMin) {
            return NextResponse.json({ success: false, error: `Minimum redemption for ${method === 'gift_voucher' ? 'Gift Voucher' : 'Bank Transfer'} is ₹${currentMin}.` }, { status: 400 });
        }

        // Run transaction or just sequential operations. For simplicity, sequential operations:
        const clientRef = db.collection("b2b_clients").doc(session.id);
        const clientDoc = await clientRef.get();
        if (!clientDoc.exists) {
            return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
        }

        const data = clientDoc.data();
        const currentBalance = data?.rewardBalance || 0;

        if (currentBalance < amountNum) {
            return NextResponse.json({ success: false, error: "Insufficient reward balance." }, { status: 400 });
        }

        // Deduct balance
        await clientRef.update({
            rewardBalance: FieldValue.increment(-amountNum)
        });

        // Add redemption request record
        await db.collection("reward_requests").add({
            b2bClientId: session.id,
            b2bClientUsername: session.username,
            b2bClientCompany: session.companyName,
            amount: amountNum,
            method: method || "bank_transfer",
            details: details || "",
            status: "Pending",
            requestedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, newBalance: currentBalance - amountNum });
    } catch (e) {
        console.error("Redemption error:", e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
