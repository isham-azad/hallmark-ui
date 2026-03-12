"use server";

import db from "@/lib/firebase";
import { Role } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

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
        const existing = await db.collection("admins").where("email", "==", email).get();
        if (!existing.empty) {
            return { success: false, error: "Admin with this email already exists" };
        }

        await db.collection("admins").add({
            name,
            email,
            phone,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to add staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function editStaff(id: string, name: string, email: string, phone: string, role: string) {
    try {
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

        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to edit staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function updateStaffRole(id: string, role: string) {
    try {
        await db.collection("admins").doc(id).update({
            role,
            updatedAt: new Date()
        });
        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to update staff role:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function deleteStaff(id: string) {
    try {
        // Prevent deleting the last super admin if possible, but for now simple delete
        await db.collection("admins").doc(id).delete();
        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete staff:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
