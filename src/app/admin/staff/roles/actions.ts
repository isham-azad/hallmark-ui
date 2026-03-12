"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";

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
        return snapshot.docs.map(doc => {
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
        await db.collection("roles").add({
            name,
            permissionKeys,
            createdAt: new Date()
        });
        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to add role" };
    }
}

export async function updateRole(id: string, name: string, permissionKeys: string[]) {
    try {
        await db.collection("roles").doc(id).update({
            name,
            permissionKeys,
            updatedAt: new Date()
        });
        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Update failed" };
    }
}

export async function deleteRole(id: string) {
    try {
        await db.collection("roles").doc(id).delete();
        revalidatePath("/admin/staff/roles");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}
