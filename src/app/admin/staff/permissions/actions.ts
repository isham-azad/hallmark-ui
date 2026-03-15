"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export interface Permission {
    id: string;
    key: string;
    name: string;
    description: string;
    createdAt?: string;
}

function toISO(val: any): string {
    if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getPermissions(): Promise<Permission[]> {
    try {
        const snapshot = await db.collection("permissions").orderBy("key", "asc").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                key: data.key || "",
                name: data.name || "",
                description: data.description || "",
                createdAt: toISO(data.createdAt),
            };
        });
    } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return [];
    }
}

export async function addPermission(key: string, name: string, description: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        const existing = await db.collection("permissions").where("key", "==", key).get();
        if (!existing.empty) return { success: false, error: "Permission key already exists" };

        const docRef = await db.collection("permissions").add({
            key: key.toLowerCase().replace(/\s+/g, "_"),
            name,
            description,
            createdAt: new Date()
        });

        await logAction(session.email, session.name, "ADD_PERMISSION", { permissionKey: key, permissionId: docRef.id });

        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Internal Error" };
    }
}

export async function updatePermission(id: string, name: string, description: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("permissions").doc(id).update({
            name,
            description,
            updatedAt: new Date()
        });

        await logAction(session.email, session.name, "UPDATE_PERMISSION", { permissionId: id, permissionName: name });

        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Update failed" };
    }
}

export async function deletePermission(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("permissions").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_PERMISSION", { permissionId: id });

        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}
