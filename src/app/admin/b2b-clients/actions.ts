"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction, hashPassword } from "@/lib/auth";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";
import { PERMISSIONS } from "@/lib/permissions";
import { FieldValue } from "firebase-admin/firestore";

export interface B2BClient {
    id: string;
    username: string;
    companyName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    rewardPercentage?: number;
    status: "active" | "disabled";
    createdAt?: string;
}



export async function getB2BClients(): Promise<B2BClient[]> {
    try {
        const session = await getAdminSession();
        if (!session) return [];

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return [];
        }

        const snapshot = await db.collection("b2b_clients").orderBy("createdAt", "desc").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            let createdAtStr = new Date().toISOString();
            if (data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt) {
                createdAtStr = data.createdAt.toDate().toISOString();
            } else if (data.createdAt instanceof Date) {
                createdAtStr = data.createdAt.toISOString();
            } else if (typeof data.createdAt === "string") {
                createdAtStr = data.createdAt;
            }

            return {
                id: doc.id,
                username: data.username || "",
                companyName: data.companyName || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                email: data.email || "",
                phone: data.phone || "",
                address: data.address || "",
                city: data.city || "",
                zip: data.zip || "",
                rewardPercentage: data.rewardPercentage !== undefined ? Number(data.rewardPercentage) : 2,
                status: data.status || "active",
                createdAt: createdAtStr,
            };
        });
    } catch (error) {
        console.error("Failed to fetch B2B clients:", error);
        return [];
    }
}

export async function addB2BClient(data: any) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return { success: false, error: "Access Denied" };
        }

        const { username, password, companyName, firstName, lastName, email, phone, address, city, zip, rewardPercentage } = data;
        
        // Ensure username is unique
        const existing = await db.collection("b2b_clients").where("username", "==", username.trim()).get();
        if (!existing.empty) {
            return { success: false, error: "Username is already taken." };
        }

        const docRef = await db.collection("b2b_clients").add({
            username: username.trim(),
            companyName: companyName.trim(),
            firstName: firstName?.trim() || "",
            lastName: lastName?.trim() || "",
            email: email?.trim() || "",
            phone: phone?.trim() || "",
            address: address?.trim() || "",
            city: city?.trim() || "",
            zip: zip?.trim() || "",
            rewardPercentage: rewardPercentage !== undefined ? Number(rewardPercentage) : 2,
            rewardBalance: 0,
            passwordHash: await hashPassword(password),
            status: "active",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "ADD_B2B_CLIENT", { clientId: docRef.id, username });

        revalidatePath("/admin/b2b-clients");
        return { success: true };
    } catch (e) {
        console.error("Add B2B client error:", e);
        return { success: false, error: "Failed to add B2B client" };
    }
}

export async function editB2BClient(id: string, data: any) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return { success: false, error: "Access Denied" };
        }

        const { username, companyName, firstName, lastName, email, phone, address, city, zip, rewardPercentage } = data;
        
        // Ensure username is unique
        const existing = await db.collection("b2b_clients").where("username", "==", username.trim()).get();
        if (!existing.empty && existing.docs[0].id !== id) {
            return { success: false, error: "Username is already taken by another client." };
        }

        await db.collection("b2b_clients").doc(id).update({
            username: username.trim(),
            companyName: companyName.trim(),
            firstName: firstName?.trim() || "",
            lastName: lastName?.trim() || "",
            email: email?.trim() || "",
            phone: phone?.trim() || "",
            address: address?.trim() || "",
            city: city?.trim() || "",
            zip: zip?.trim() || "",
            rewardPercentage: rewardPercentage !== undefined ? Number(rewardPercentage) : 2,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "EDIT_B2B_CLIENT", { clientId: id, username });

        revalidatePath("/admin/b2b-clients");
        return { success: true };
    } catch (e) {
        console.error("Edit B2B client error:", e);
        return { success: false, error: "Failed to edit B2B client" };
    }
}

export async function resetB2BClientPassword(id: string, newPassword: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("b2b_clients").doc(id).update({
            passwordHash: await hashPassword(newPassword),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "RESET_B2B_PASSWORD", { clientId: id });

        revalidatePath("/admin/b2b-clients");
        return { success: true };
    } catch (e) {
        console.error("Reset B2B password error:", e);
        return { success: false, error: "Failed to update password" };
    }
}

export async function toggleB2BClientStatus(id: string, currentStatus: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return { success: false, error: "Access Denied" };
        }

        const newStatus = currentStatus === "active" ? "disabled" : "active";
        await db.collection("b2b_clients").doc(id).update({
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "TOGGLE_B2B_CLIENT_STATUS", { clientId: id, newStatus });

        revalidatePath("/admin/b2b-clients");
        return { success: true, newStatus };
    } catch (e) {
        console.error("Toggle B2B status error:", e);
        return { success: false, error: "Failed to process request." };
    }
}

export async function deleteB2BClient(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("b2b_clients").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_B2B_CLIENT", { clientId: id });

        revalidatePath("/admin/b2b-clients");
        return { success: true };
    } catch (e) {
        console.error("Delete B2B client error:", e);
        return { success: false, error: "Failed to delete client" };
    }
}

export async function getB2BClientDetail(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return null;

        const clientDoc = await db.collection("b2b_clients").doc(id).get();
        if (!clientDoc.exists) return null;
        const clientData = clientDoc.data()!;

        // Fetch Orders
        const ordersSnap = await db.collection("orders").where("b2bClientId", "==", id).orderBy("createdAt", "desc").get();
        const orders: any[] = ordersSnap.docs.map((doc: any) => {
            const d = doc.data();
            return {
                id: doc.id,
                orderNo: d.orderNo,
                total: d.total,
                status: d.status,
                paymentStatus: d.paymentStatus || "Pending",
                rewardsEarned: d.rewardsEarned || 0,
                rewardsUsed: d.rewardsUsed || 0,
                createdAt: d.createdAt?.toDate?.() ? d.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        // Fetch Rewards - combining manual and order-based
        const [manualSnap, redemptionsSnap] = await Promise.all([
            db.collection("reward_manual_adjustments").where("b2bClientId", "==", id).get(),
            db.collection("reward_requests").where("b2bClientId", "==", id).get()
        ]);

        const rewards: any[] = [];
        
        // 1. Process Manual Adjustments
        manualSnap.docs.forEach((doc: any) => {
            const d = doc.data();
            rewards.push({
                id: doc.id,
                type: (d.amount || 0) >= 0 ? 'Earned' : 'Used',
                amount: Math.abs(d.amount || 0),
                note: d.notes || 'Manual Adjustment',
                createdAt: d.createdAt?.toDate?.() ? d.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        // 2. Process Order-based Rewards from the already fetched orders
        orders.forEach(o => {
            if (o.rewardsEarned > 0) {
                rewards.push({
                    id: o.id + "_earned",
                    type: 'Earned',
                    amount: o.rewardsEarned,
                    note: `Order ${o.orderNo}`,
                    createdAt: o.createdAt
                });
            }
            if (o.rewardsUsed > 0) {
                rewards.push({
                    id: o.id + "_used",
                    type: 'Used',
                    amount: o.rewardsUsed,
                    note: `Used in Order ${o.orderNo}`,
                    createdAt: o.createdAt
                });
            }
        });

        // 3. Process Redemptions
        redemptionsSnap.docs.forEach((doc: any) => {
            const d = doc.data();
            rewards.push({
                id: doc.id,
                type: 'Redeemed',
                amount: d.amount,
                note: `Redemption (${d.method?.replace('_', ' ') || 'Requested'})`,
                status: d.status,
                createdAt: d.requestedAt?.toDate?.() ? d.requestedAt.toDate().toISOString() : new Date().toISOString()
            });
        });

        rewards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
            client: {
                id: clientDoc.id,
                username: clientData.username || "",
                companyName: clientData.companyName || "",
                firstName: clientData.firstName || "",
                lastName: clientData.lastName || "",
                email: clientData.email || "",
                phone: clientData.phone || "",
                address: clientData.address || "",
                city: clientData.city || "",
                zip: clientData.zip || "",
                rewardPercentage: clientData.rewardPercentage || 0,
                rewardBalance: clientData.rewardBalance || 0,
                status: clientData.status || "active",
                createdAt: clientData.createdAt?.toDate?.() ? clientData.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: clientData.updatedAt?.toDate?.() ? clientData.updatedAt.toDate().toISOString() : new Date().toISOString()
            },
            orders,
            rewards
        };
    } catch (error) {
        console.error("Failed to fetch client detail:", error);
        return null;
    }
}
