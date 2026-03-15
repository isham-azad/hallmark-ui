"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export interface RoleData {
    id: string;
    name: string;
    description?: string;
    permissionKeys: string[];
    createdAt?: string;
}

function toISO(val: any): string {
    if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getRoles(): Promise<RoleData[]> {
    try {
        const snapshot = await db.collection("roles").orderBy("name", "asc").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "",
                description: data.description || "",
                permissionKeys: data.permissionKeys || [],
                createdAt: toISO(data.createdAt),
            };
        });
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        return [];
    }
}

export async function addRole(name: string, permissionKeys: string[]) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        const docRef = await db.collection("roles").add({
            name,
            permissionKeys,
            createdAt: new Date()
        });

        await logAction(session.email, session.name, "ADD_ROLE", { roleName: name, roleId: docRef.id });

        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to add role" };
    }
}

export async function updateRole(id: string, name: string, permissionKeys: string[]) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("roles").doc(id).update({
            name,
            permissionKeys,
            updatedAt: new Date()
        });

        await logAction(session.email, session.name, "UPDATE_ROLE", { roleId: id, roleName: name });

        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Update failed" };
    }
}

export async function deleteRole(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ROLES)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("roles").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_ROLE", { roleId: id });

        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}
