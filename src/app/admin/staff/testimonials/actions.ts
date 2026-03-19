"use server";

import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

async function verifyAuth(permission?: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    if (permission) {
        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(permission)) {
            throw new Error("Access Denied");
        }
    }
    return session;
}

export async function createTestimonial(formData: { name: string; role: string; quote: string; rating: number }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_TESTIMONIALS);

        const docRef = await db.collection("testimonials").add({
            name: formData.name,
            role: formData.role,
            quote: formData.quote,
            rating: formData.rating || 5,
            status: "active",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "CREATE_TESTIMONIAL", { name: formData.name, docId: docRef.id });

        revalidatePath("/admin/staff/testimonials");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create testimonial:", error);
        return { success: false, error: error.message || "Failed to create testimonial." };
    }
}

export async function updateTestimonial(id: string, formData: { name: string; role: string; quote: string; rating: number }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_TESTIMONIALS);
        await db.collection("testimonials").doc(id).update({
            name: formData.name,
            role: formData.role,
            quote: formData.quote,
            rating: formData.rating,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_TESTIMONIAL", { id, name: formData.name });

        revalidatePath("/admin/staff/testimonials");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update testimonial:", error);
        return { success: false, error: error.message || "Failed to update testimonial." };
    }
}

export async function setTestimonialStatus(id: string, status: "active" | "disabled") {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_TESTIMONIALS);
        await db.collection("testimonials").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "SET_TESTIMONIAL_STATUS", { id, status });

        revalidatePath("/admin/staff/testimonials");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update testimonial status:", error);
        return { success: false, error: error.message || "Failed to update status." };
    }
}

export async function deleteTestimonial(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_TESTIMONIALS);

        await db.collection("testimonials").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_TESTIMONIAL", { id });

        revalidatePath("/admin/staff/testimonials");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete testimonial:", error);
        return { success: false, error: error.message || "Failed to delete testimonial." };
    }
}
