"use server";

import db from "@/lib/firebase";
import { Role, PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction, hashPassword } from "@/lib/auth";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
}

function toISO(val: any): string {
    if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getStaff(): Promise<AdminUser[]> {
    try {
        const snapshot = await db.collection("admins").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "Admin",
                email: data.email || "",
                phone: data.phone || "",
                role: (data.role as string) || "Delivery Staff",
                createdAt: toISO(data.createdAt),
                updatedAt: toISO(data.updatedAt),
            };
        });
    } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
    }
}

export async function addStaff(name: string, email: string, phone: string, role: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, error: "Access Denied" };
        }

        const existing = await db.collection("admins").where("email", "==", email).get();
        if (!existing.empty) {
            return { success: false, error: "Admin with this email already exists" };
        }

        const docRef = await db.collection("admins").add({
            name,
            email,
            phone,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await logAction(session.email, session.name, "ADD_STAFF", { staffEmail: email, staffRole: role, staffId: docRef.id });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to add staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function editStaff(id: string, name: string, email: string, phone: string, role: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, error: "Access Denied" };
        }

        const existing = await db.collection("admins").where("email", "==", email).get();
        if (!existing.empty && existing.docs[0].id !== id) {
            return { success: false, error: "Admin with this email already exists" };
        }

        await db.collection("admins").doc(id).update({
            name,
            email,
            phone,
            role,
            updatedAt: new Date()
        });

        await logAction(session.email, session.name, "EDIT_STAFF", { staffId: id, staffEmail: email, staffRole: role });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to edit staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function updateStaffRole(id: string, role: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("admins").doc(id).update({
            role,
            updatedAt: new Date()
        });

        await logAction(session.email, session.name, "UPDATE_STAFF_ROLE", { staffId: id, newRole: role });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to update staff role:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function deleteStaff(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, error: "Access Denied" };
        }

        // Prevent self-deletion
        if (session.email) {
            const adminDoc = await db.collection("admins").doc(id).get();
            if (adminDoc.exists && adminDoc.data()?.email === session.email) {
                return { success: false, error: "You cannot delete yourself." };
            }
        }

        await db.collection("admins").doc(id).delete();
        
        await logAction(session.email, session.name, "DELETE_STAFF", { staffId: id });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}



export async function setupStaffPassword(id: string, password: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, error: "Access Denied" };
        }

        const passwordHash = await hashPassword(password);

        await db.collection("admins").doc(id).update({
            passwordHash,
            updatedAt: new Date()
        });

        const adminDoc = await db.collection("admins").doc(id).get();
        const adminEmail = adminDoc.data()?.email || "";

        await logAction(session.email, session.name, "SETUP_STAFF_PASSWORD", { staffId: id, staffEmail: adminEmail });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to setup staff password:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

