"use server";

import db from "@/lib/firebase";
import { sendVoucherEmail } from "@/lib/email";
import { logAction, getAdminSession } from "@/lib/auth";

export async function getRewardsHistory() {
    try {
        const [ordersEarnedSnap, ordersUsedSnap, redemptionsSnap, manualSnap] = await Promise.all([
            db.collection("orders").where("rewardsEarned", ">", 0).get(),
            db.collection("orders").where("rewardsUsed", ">", 0).get(),
            db.collection("reward_requests").get(),
            db.collection("reward_manual_adjustments").get()
        ]);

        const transactions: any[] = [];

        // 1. Process Earrings from Orders
        ordersEarnedSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: 'Earned',
                amount: data.rewardsEarned,
                invoiceAmount: data.total || 0,
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
                invoiceAmount: data.total || 0,
                orderNo: data.orderNo,
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        // 3. Process Redemptions (Bank Transfer, etc.)
        redemptionsSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: 'Redeemed',
                amount: data.amount,
                invoiceAmount: data.amount || 0,
                orderNo: `Redemption (${data.method.replace('_', ' ')})`,
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                createdAt: data.requestedAt?.toDate?.() ? data.requestedAt.toDate().toISOString() : new Date().toISOString(),
                status: data.status
            });
        });

        // 4. Process Manual Adjustments (Admin added)
        manualSnap.docs.forEach((doc: any) => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                type: (data.amount || 0) >= 0 ? 'Earned' : 'Used',
                amount: Math.abs(data.amount || 0),
                rawAmount: data.amount || 0,
                invoiceAmount: data.invoiceAmount || 0,
                orderNo: data.invoiceNo || data.notes || 'Admin Adjustment',
                b2bClientCompany: data.b2bClientCompany || 'Customer',
                isManual: true,
                invoiceDate: data.invoiceDate || null,
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
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

        // If it's a gift voucher and just marked as completed, generate the voucher
        if (status === "Completed" && redemptionData.method === "gift_voucher") {
            // Check if voucher already exists to prevent duplicate generation
            const existingVouchers = await db.collection("gift_vouchers").where("redemptionRequestId", "==", requestId).get();
            
            if (existingVouchers.empty) {
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

                // Get target email for notification
                let clientEmail = "";
                
                // Priority: 1. Email entered during redemption, 2. Client's registered email
                const enteredEmail = redemptionData.details?.trim();
                const isEmail = enteredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredEmail);

                if (isEmail) {
                    clientEmail = enteredEmail;
                } else if (redemptionData.b2bClientId) {
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
                    console.log(`E-Gift Voucher email sent to ${clientEmail} (Source: ${isEmail ? 'Redemption Details' : 'Client Profile'})`);
                }

                console.log(`Generated Gift Voucher ${voucherCode} for ${redemptionData.b2bClientCompany}`);
            }
        }

        // Log action
        const admin = await getAdminSession();
        if (admin) {
            await logAction(admin.email, admin.name, "REWARD_STATUS_UPDATE", {
                requestId,
                status,
                client: redemptionData.b2bClientCompany,
                amount: redemptionData.amount,
                method: redemptionData.method
            });
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
        const voucherDoc = await db.collection("gift_vouchers").doc(voucherId).get();
        const voucherData = voucherDoc.data();

        await db.collection("gift_vouchers").doc(voucherId).update({
            status: "Void",
            updatedAt: new Date()
        });

        // Log action
        const admin = await getAdminSession();
        if (admin) {
            await logAction(admin.email, admin.name, "GIFT_VOUCHER_VOID", {
                voucherId,
                code: voucherData?.code,
                client: voucherData?.b2bClientCompany
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error voiding voucher:", error);
        return { success: false };
    }
}
export async function getB2BClients() {
    try {
        const snap = await db.collection("b2b_clients").get();
        return snap.docs.map((doc: any) => ({
            id: doc.id,
            companyName: doc.data().companyName || 'No Company',
            username: doc.data().username || 'unknown',
            rewardPercentage: doc.data().rewardPercentage ?? 2
        }));
    } catch (error) {
        console.error("Error fetching admin B2B clients:", error);
        return [];
    }
}

export async function addManualPoints(clientId: string, amount: number, invoiceNo: string, invoiceDate?: string, invoiceAmount?: number) {
    try {
        const clientRef = db.collection("b2b_clients").doc(clientId);
        const clientDoc = await clientRef.get();
        if (!clientDoc.exists) return { success: false, error: "Client not found" };
        const clientData = clientDoc.data()!;

        const batch = db.batch();
        batch.update(clientRef, {
            rewardBalance: (clientData.rewardBalance || 0) + amount,
            updatedAt: new Date()
        });

        const adjustmentRef = db.collection("reward_manual_adjustments").doc();
        batch.set(adjustmentRef, {
            b2bClientId: clientId,
            b2bClientCompany: clientData.companyName || 'Unknown',
            amount,
            invoiceAmount: invoiceAmount || 0,
            invoiceNo,
            invoiceDate: invoiceDate || null,
            createdAt: new Date(),
            type: amount >= 0 ? 'Earned' : 'Used'
        });

        await batch.commit();

        // Log action
        const admin = await getAdminSession();
        if (admin) {
            await logAction(admin.email, admin.name, amount >= 0 ? "REWARD_ADD_MANUAL" : "REWARD_DEDUCT_MANUAL", {
                clientId,
                client: clientData.companyName,
                amount,
                invoiceAmount: invoiceAmount || 0,
                invoiceNo
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error adding manual points:", error);
        return { success: false, error: "Database error" };
    }
}
export async function deleteManualPoints(adjustmentId: string) {
    try {
        const adjustmentRef = db.collection("reward_manual_adjustments").doc(adjustmentId);
        const adjustmentDoc = await adjustmentRef.get();
        if (!adjustmentDoc.exists) return { success: false, error: "Adjustment not found" };
        
        const adjustmentData = adjustmentDoc.data()!;
        const clientId = adjustmentData.b2bClientId;
        const amount = adjustmentData.amount || 0;
        const type = adjustmentData.type; // 'Earned' or 'Used'
        
        // Reverse the amount: if it was Earned (positive), subtract. If it was Used (negative initially, but stored as absolute and 'Used'), we need to check how it was applied.
        // Wait, the add logic stores amount as absolute value and type as Earned/Used based on amount >= 0.
        // Let's look at addManualPoints: 
        // batch.update(clientRef, { rewardBalance: (clientData.rewardBalance || 0) + amount })
        // If they enter -50, it adds -50. type is 'Used'.
        // Wait, if addManualPoints is called with negative amount, amount is stored as negative in `b2b_clients` balance, but in adjustment it stores `amount` (which is negative).
        // Let's re-read addManualPoints in actions.ts:
        // amount is passed in.
        // batch.set(adjustmentRef, { amount, type: amount >= 0 ? 'Earned' : 'Used' });
        // So the amount in adjustment is exactly the amount added to rewardBalance.
        // To revert, we subtract the same amount from rewardBalance.
        
        const clientRef = db.collection("b2b_clients").doc(clientId);
        const clientDoc = await clientRef.get();
        
        const batch = db.batch();
        
        if (clientDoc.exists) {
            const clientData = clientDoc.data()!;
            batch.update(clientRef, {
                rewardBalance: (clientData.rewardBalance || 0) - amount,
                updatedAt: new Date()
            });
        }
        
        batch.delete(adjustmentRef);
        await batch.commit();

        const admin = await getAdminSession();
        if (admin) {
            await logAction(admin.email, admin.name, "REWARD_DELETE_MANUAL", {
                adjustmentId,
                clientId,
                amount
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting manual points:", error);
        return { success: false, error: "Database error" };
    }
}

export async function editManualPoints(adjustmentId: string, newAmount: number, invoiceNo: string, invoiceDate?: string, invoiceAmount?: number) {
    try {
        const adjustmentRef = db.collection("reward_manual_adjustments").doc(adjustmentId);
        const adjustmentDoc = await adjustmentRef.get();
        if (!adjustmentDoc.exists) return { success: false, error: "Adjustment not found" };
        
        const adjustmentData = adjustmentDoc.data()!;
        const clientId = adjustmentData.b2bClientId;
        const oldAmount = adjustmentData.amount || 0;
        
        const difference = newAmount - oldAmount;
        
        const clientRef = db.collection("b2b_clients").doc(clientId);
        const clientDoc = await clientRef.get();
        
        const batch = db.batch();
        
        if (clientDoc.exists) {
            const clientData = clientDoc.data()!;
            batch.update(clientRef, {
                rewardBalance: (clientData.rewardBalance || 0) + difference,
                updatedAt: new Date()
            });
        }
        
        batch.update(adjustmentRef, {
            amount: newAmount,
            invoiceAmount: invoiceAmount || 0,
            invoiceNo,
            invoiceDate: invoiceDate || null,
            type: newAmount >= 0 ? 'Earned' : 'Used',
            updatedAt: new Date()
        });
        
        await batch.commit();

        const admin = await getAdminSession();
        if (admin) {
            await logAction(admin.email, admin.name, "REWARD_EDIT_MANUAL", {
                adjustmentId,
                clientId,
                oldAmount,
                newAmount,
                invoiceNo
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error editing manual points:", error);
        return { success: false, error: "Database error" };
    }
}
