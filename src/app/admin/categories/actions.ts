"use server";

import db from "@/lib/firebase";
import { deleteImageByUrl, deleteFolder } from "@/lib/cloudinary";
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

export async function createCategory(formData: { id: string; name: string; summary: string; image?: string }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_CATEGORIES);
        const docId = formData.id || formData.name.toLowerCase().replace(/\s+/g, "-");

        await db.collection("categories").doc(docId).set({
            name: formData.name,
            summary: formData.summary,
            image: formData.image || null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "CREATE_CATEGORY", { name: formData.name, docId });

        revalidatePath("/admin/categories");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create category:", error);
        return { success: false, error: error.message || "Failed to create category." };
    }
}

export async function updateCategory(id: string, formData: { name: string; summary: string; image?: string }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_CATEGORIES);
        await db.collection("categories").doc(id).update({
            name: formData.name,
            summary: formData.summary,
            image: formData.image || null,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_CATEGORY", { id, name: formData.name });

        revalidatePath("/admin/categories");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update category:", error);
        return { success: false, error: error.message || "Failed to update category." };
    }
}

export async function setCategoryStatus(id: string, status: "active" | "disabled") {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_CATEGORIES);
        await db.collection("categories").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "SET_CATEGORY_STATUS", { id, status });

        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update category status:", error);
        return { success: false, error: error.message || "Failed to update status." };
    }
}

export async function deleteCategory(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_CATEGORIES);
        const productsSnap = await db.collection("products").where("categoryId", "==", id).limit(1).get();

        if (!productsSnap.empty) {
            return { success: false, error: "Cannot delete category that has associated products." };
        }

        const doc = await db.collection("categories").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            const img = data?.image;
            if (img && typeof img === "string" && img.includes("cloudinary")) {
                try {
                    await deleteImageByUrl(img);
                } catch (err) {
                    console.warn("Could not delete category image from Cloudinary:", err);
                }
            }
            try {
                await deleteFolder(`hallmark/categories/${id}`);
            } catch (err) {
                console.warn("Could not delete category folder from Cloudinary:", err);
            }
        }

        await db.collection("categories").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_CATEGORY", { id });

        revalidatePath("/admin/categories");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete category:", error);
        return { success: false, error: error.message || "Failed to delete category." };
    }
}
