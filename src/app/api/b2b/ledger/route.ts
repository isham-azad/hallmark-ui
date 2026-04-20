import { NextResponse } from "next/server";
import { getB2BSession } from "@/lib/b2b-auth";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

function parseCurrency(val: any): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
}

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

        const sortedDocs = ordersSnap.docs.sort((a: any, b: any) => {
            const dateA = a.data().createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.data().createdAt?.toDate?.()?.getTime() || 0;
            return dateA - dateB;
        });

        let pending = 0;
        let paid = 0;
        let redeemed = 0;
        let runningBalance = 0;
        
        const entries: any[] = [];

        sortedDocs.forEach((doc: any) => {
            const data = doc.data();
            const invoiceAmount = parseCurrency(data.total);
            const isPaid = data.paymentStatus === "Paid" || data.paymentStatus === "Credit Card" || data.paymentStatus === "Tabby" || data.paymentStatus === "Stripe";
            const dateStr = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
            
            redeemed += (data.rewardsUsed || 0) + (data.voucherAmount || 0);

            // 1. Debit the invoice amount
            runningBalance += invoiceAmount;
            entries.push({
                id: `inv-${doc.id}`,
                date: dateStr,
                referenceNo: data.orderNo || `INV-${doc.id.slice(0, 5)}`,
                description: `Invoice for order`,
                amount: invoiceAmount,
                type: "Debit",
                balance: runningBalance
            });

            // 2. If it's paid, credit it.
            if (isPaid) {
                paid += invoiceAmount;
                runningBalance -= invoiceAmount;
                entries.push({
                    id: `pmt-${doc.id}`,
                    date: data.paidAt?.toDate?.()?.toISOString() || dateStr,
                    referenceNo: `PMT-${data.orderNo || doc.id.slice(0, 5)}`,
                    description: `Payment received via ${data.paymentMethod || data.payment || 'system'}`,
                    amount: invoiceAmount,
                    type: "Credit",
                    balance: runningBalance
                });
            } else {
                pending += invoiceAmount;
            }
        });

        // The UI wants chronologically newest first usually, so we reverse it for display
        entries.reverse();

        return NextResponse.json({
            success: true,
            stats: {
                pending,
                paid,
                redeemed
            },
            entries
        });
    } catch (error) {
        console.error("Fetch B2B ledger error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
