import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";
import { getB2BSession } from "@/lib/b2b-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await getB2BSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const snap = await db.collection("gift_vouchers")
            .where("b2bClientId", "==", session.id)
            .get();

        const vouchers = snap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                code: data.code,
                amount: data.amount || 0,
                balance: data.balance || 0,
                status: data.status || 'Active',
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                expiryDate: data.expiryDate?.toDate?.() ? data.expiryDate.toDate().toISOString() : null,
            };
        }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, vouchers });
    } catch (error) {
        console.error("Fetch B2B vouchers error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
