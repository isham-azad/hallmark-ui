import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();
        if (!code) return NextResponse.json({ success: false, error: "Voucher code required" }, { status: 400 });

        const snap = await db.collection("gift_vouchers")
            .where("code", "==", code)
            .where("status", "==", "Active")
            .limit(1)
            .get();

        if (snap.empty) {
            return NextResponse.json({ success: false, error: "Invalid or expired voucher code" }, { status: 404 });
        }

        const voucher = snap.docs[0].data();
        const now = new Date();
        const expiryDate = voucher.expiryDate?.toDate?.() || new Date(voucher.expiryDate);

        if (expiryDate < now) {
            return NextResponse.json({ success: false, error: "Voucher code has expired" }, { status: 400 });
        }

        if (voucher.balance <= 0) {
            return NextResponse.json({ success: false, error: "Voucher check balance is zero" }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            voucher: {
                id: snap.docs[0].id,
                code: voucher.code,
                balance: voucher.balance
            }
        });
    } catch (error) {
        console.error("Voucher validation error:", error);
        return NextResponse.json({ success: false, error: "Validation failed" }, { status: 500 });
    }
}
