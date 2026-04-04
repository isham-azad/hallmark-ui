import { NextResponse } from "next/server";
import { getB2BSession } from "@/lib/b2b-auth";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getB2BSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const [ordersSnap, redemptionsSnap] = await Promise.all([
            db.collection("orders")
                .where("b2bClientId", "==", session.id)
                .limit(50)
                .get(),
            db.collection("reward_requests")
                .where("b2bClientId", "==", session.id)
                .limit(50)
                .get()
        ]);

        const orderTransactions = ordersSnap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                orderNo: data.orderNo,
                total: data.total,
                status: data.status,
                rewardsUsed: data.rewardsUsed || 0,
                rewardsEarned: data.rewardsEarned || 0,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        const redemptionTransactions = redemptionsSnap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: `red_${doc.id}`,
                orderNo: `Redemption (${data.method.replace('_', ' ')})`,
                total: data.amount,
                status: data.status,
                rewardsUsed: data.amount, // Redemptions reduce the balance
                rewardsEarned: 0,
                createdAt: data.requestedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        const transactions = [...orderTransactions, ...redemptionTransactions]
            .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        return NextResponse.json({ success: true, transactions });
    } catch (error) {
        console.error("Fetch B2B transactions error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
