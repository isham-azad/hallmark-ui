"use server";

import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export async function createPaymentMethod(formData: { id: string; name: string; summary: string }) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PAYMENTS)) {
            return { success: false, error: "Access Denied" };
        }

        const docId = formData.id || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-");

        await db.collection("paymentMethods").doc(docId).set({
            name: formData.name,
            summary: formData.summary,
        });

        await logAction(session.email, session.name, "CREATE_PAYMENT_METHOD", { name: formData.name, docId });

        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to create payment method:", error);
        return { success: false, error: "Failed to create payment method. The ID might already exist." };
    }
}

export async function updatePaymentMethod(id: string, formData: { name: string; summary: string }) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PAYMENTS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("paymentMethods").doc(id).update({
            name: formData.name,
            summary: formData.summary,
        });

        await logAction(session.email, session.name, "UPDATE_PAYMENT_METHOD", { id, name: formData.name });

        revalidatePath("/admin/staff/payment-methods");
        revalidatePath(`/admin/staff/payment-methods/edit/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment method:", error);
        return { success: false, error: "Failed to update payment method." };
    }
}

export async function setPaymentMethodStatus(id: string, status: "active" | "disabled") {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PAYMENTS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("paymentMethods").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "SET_PAYMENT_STATUS", { id, status });

        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment method status:", error);
        return { success: false, error: "Failed to update status." };
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PAYMENTS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("paymentMethods").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_PAYMENT_METHOD", { id });

        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete payment method:", error);
        return { success: false, error: "Failed to delete payment method." };
    }
}
