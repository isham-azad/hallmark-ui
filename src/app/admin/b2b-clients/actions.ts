"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";
import { PERMISSIONS } from "@/lib/permissions";
import crypto from "crypto";
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

function hashPassword(password: string) {
    return crypto.createHash("sha256").update(password).digest("hex");
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
            passwordHash: hashPassword(password),
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
            passwordHash: hashPassword(newPassword),
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
