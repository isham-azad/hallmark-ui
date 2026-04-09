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

        const ordersSnap = await db.collection("orders")
            .where("b2bClientId", "==", session.id)
            .limit(100)
            .get();

        const orders = ordersSnap.docs
            .map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    orderNo: data.orderNo || "",
                    customer: data.customer || "",
                    total: data.total || "₹0",
                    subtotal: data.subtotal || null,
                    shippingAmount: data.shippingAmount || 0,
                    status: data.status || "Pending",
                    paymentMethod: data.paymentMethod || data.payment || "COD",
                    paymentStatus: data.paymentStatus || "Pending",
                    rewardsEarned: data.rewardsEarned || 0,
                    rewardsUsed: data.rewardsUsed || 0,
                    voucherAmount: data.voucherAmount || 0,
                    address: data.address || null,
                    city: data.city || null,
                    zip: data.zip || null,
                    items: (data.items || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        sku: item.sku || null,
                        qty: item.qty,
                        price: item.price,
                        image: item.image || null,
                    })),
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                };
            })
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, orders });
    } catch (error) {
        console.error("Fetch B2B orders error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
