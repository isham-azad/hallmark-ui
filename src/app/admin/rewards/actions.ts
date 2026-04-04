"use server";

import db from "@/lib/firebase";
import { sendVoucherEmail } from "@/lib/email";

export async function getRewardsHistory() {
    try {
        const [ordersEarnedSnap, ordersUsedSnap, redemptionsSnap] = await Promise.all([
            db.collection("orders").where("rewardsEarned", ">", 0).get(),
            db.collection("orders").where("rewardsUsed", ">", 0).get(),
            db.collection("reward_requests").get()
        ]);

        const transactions: any[] = [];

        // 1. Process Earrings from Orders
        ordersEarnedSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: 'Earned',
                amount: data.rewardsEarned,
                orderNo: data.orderNo,
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        // 2. Process Point Usage in Orders (Discounts)
        ordersUsedSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            transactions.push({
                id: doc.id + '_used',
                type: 'Used',
                amount: data.rewardsUsed,
                orderNo: data.orderNo,
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        // 3. Process Redemptions (Bank Transfer, etc.)
        redemptionsSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            // Only show Approved or Completed redemptions in history usually, 
            // or show all with status? Let's show all for full audit.
            transactions.push({
                id: doc.id,
                type: 'Redeemed',
                amount: data.amount,
                orderNo: `Redemption (${data.method.replace('_', ' ')})`,
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                createdAt: data.requestedAt?.toDate?.() ? data.requestedAt.toDate().toISOString() : new Date().toISOString(),
                status: data.status
            });
        });

        return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Error fetching rewards visibility:", error);
        return [];
    }
}

export async function getRedemptionRequests() {
    try {
        const snap = await db.collection("reward_requests")
            .orderBy("requestedAt", "desc")
            .get();

        return snap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                b2bClientId: data.b2bClientId || null,
                b2bClientUsername: data.b2bClientUsername || null,
                b2bClientCompany: data.b2bClientCompany || null,
                amount: data.amount || 0,
                method: data.method || null,
                details: data.details || null,
                status: data.status || 'Pending',
                requestedAt: data.requestedAt?.toDate?.() ? data.requestedAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : null,
            };
        });
    } catch (error) {
        console.error("Error fetching redemptions:", error);
        return [];
    }
}

export async function updateRedemptionStatus(requestId: string, status: string) {
    try {
        const redemptionRef = db.collection("reward_requests").doc(requestId);
        const redemptionDoc = await redemptionRef.get();
        
        if (!redemptionDoc.exists) return { success: false, error: "Request not found" };
        const redemptionData = redemptionDoc.data()!;

        // Update the status
        await redemptionRef.update({
            status,
            updatedAt: new Date()
        });

        // If it's a gift voucher and just completed, generate the voucher
        if (status === "Completed" && redemptionData.method === "gift_voucher") {
            const voucherCode = generateVoucherCode();
            
            await db.collection("gift_vouchers").add({
                code: voucherCode,
                amount: redemptionData.amount,
                balance: redemptionData.amount,
                b2bClientId: redemptionData.b2bClientId,
                b2bClientUsername: redemptionData.b2bClientUsername,
                b2bClientCompany: redemptionData.b2bClientCompany,
                redemptionRequestId: requestId,
                status: "Active",
                createdAt: new Date(),
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year expiry
            });

            // Get client's email for notification
            let clientEmail = "";
            if (redemptionData.b2bClientId) {
                const clientDoc = await db.collection("b2b_clients").doc(redemptionData.b2bClientId).get();
                if (clientDoc.exists) {
                    clientEmail = clientDoc.data()?.email || "";
                }
            }

            if (clientEmail) {
                await sendVoucherEmail(
                    clientEmail,
                    redemptionData.b2bClientCompany || "Valued Client",
                    voucherCode,
                    redemptionData.amount
                );
                console.log(`E-Gift Voucher email sent to ${clientEmail}`);
            }

            console.log(`Generated Gift Voucher ${voucherCode} for ${redemptionData.b2bClientCompany}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating redemption:", error);
        return { success: false };
    }
}

function generateVoucherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like O, 0, I, 1
    let result = '';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function getGiftVouchers() {
    try {
        const snap = await db.collection("gift_vouchers")
            .orderBy("createdAt", "desc")
            .get();

        return snap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                code: data.code,
                amount: data.amount || 0,
                balance: data.balance || 0,
                b2bClientId: data.b2bClientId,
                b2bClientUsername: data.b2bClientUsername,
                b2bClientCompany: data.b2bClientCompany,
                redemptionRequestId: data.redemptionRequestId,
                status: data.status || 'Active',
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                expiryDate: data.expiryDate?.toDate?.() ? data.expiryDate.toDate().toISOString() : null,
            };
        });
    } catch (error) {
        console.error("Error fetching vouchers:", error);
        return [];
    }
}

export async function voidVoucher(voucherId: string) {
    try {
        await db.collection("gift_vouchers").doc(voucherId).update({
            status: "Void",
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error voiding voucher:", error);
        return { success: false };
    }
}
