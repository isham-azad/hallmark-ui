"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";

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
        return snapshot.docs.map(doc => {
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
        const existing = await db.collection("permissions").where("key", "==", key).get();
        if (!existing.empty) return { success: false, error: "Permission key already exists" };

        await db.collection("permissions").add({
            key: key.toLowerCase().replace(/\s+/g, "_"),
            name,
            description,
            createdAt: new Date()
        });
        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Internal Error" };
    }
}

export async function updatePermission(id: string, name: string, description: string) {
    try {
        await db.collection("permissions").doc(id).update({
            name,
            description,
            updatedAt: new Date()
        });
        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Update failed" };
    }
}

export async function deletePermission(id: string) {
    try {
        await db.collection("permissions").doc(id).delete();
        revalidatePath("/admin/staff/permissions");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}
