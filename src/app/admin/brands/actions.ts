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

export async function createBrand(formData: { id: string; name: string; summary: string; shortDesc?: string; image?: string; banner?: string; bannerMobile?: string }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_BRANDS);
        const docId = formData.id || formData.name.toLowerCase().replace(/\s+/g, "-");

        await db.collection("brands").doc(docId).set({
            name: formData.name,
            summary: formData.summary,
            shortDesc: formData.shortDesc || "",
            image: formData.image || null,
            banner: formData.banner || null,
            bannerMobile: formData.bannerMobile || null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "CREATE_BRAND", { name: formData.name, docId });

        revalidatePath("/admin/brands");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create brand:", error);
        return { success: false, error: error.message || "Failed to create brand. The ID might already exist." };
    }
}

export async function updateBrand(id: string, formData: { name: string; summary: string; shortDesc?: string; image?: string; banner?: string; bannerMobile?: string }) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_BRANDS);
        await db.collection("brands").doc(id).update({
            name: formData.name,
            summary: formData.summary,
            shortDesc: formData.shortDesc || "",
            image: formData.image || null,
            banner: formData.banner || null,
            bannerMobile: formData.bannerMobile || null,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_BRAND", { id, name: formData.name });

        revalidatePath("/admin/brands");
        revalidatePath(`/admin/brands/edit/${id}`);
        revalidatePath(`/brand/${id}`);
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update brand:", error);
        return { success: false, error: error.message || "Failed to update brand." };
    }
}

export async function setBrandStatus(id: string, status: "active" | "disabled") {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_BRANDS);
        await db.collection("brands").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "SET_BRAND_STATUS", { id, status });

        revalidatePath("/admin/brands");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update brand status:", error);
        return { success: false, error: error.message || "Failed to update status." };
    }
}

export async function deleteBrand(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_BRANDS);
        const productsSnap = await db.collection("products").where("brandId", "==", id).limit(1).get();

        if (!productsSnap.empty) {
            return { success: false, error: "Cannot delete brand that has associated products. Remove products first." };
        }

        const doc = await db.collection("brands").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            const img = data?.image;
            const banners = (data?.banner as string)?.split(',').filter(Boolean) || [];
            const mobileBanners = (data?.bannerMobile as string)?.split(',').filter(Boolean) || [];

            if (img && typeof img === "string" && img.includes("cloudinary")) {
                try {
                    await deleteImageByUrl(img);
                } catch (err) {
                    console.warn("Could not delete brand image from Cloudinary:", err);
                }
            }
            
            for (const banner of banners) {
                if (banner.includes("cloudinary")) {
                    try {
                        await deleteImageByUrl(banner);
                    } catch (err) {
                        console.warn("Could not delete brand banner from Cloudinary:", err);
                    }
                }
            }

            for (const mobBanner of mobileBanners) {
                if (mobBanner.includes("cloudinary")) {
                    try {
                        await deleteImageByUrl(mobBanner);
                    } catch (err) {
                        console.warn("Could not delete brand mobile banner from Cloudinary:", err);
                    }
                }
            }
            try {
                await deleteFolder(`hallmark/brands/${id}`);
            } catch (err) {
                console.warn("Could not delete brand folder from Cloudinary:", err);
            }
        }

        await db.collection("brands").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_BRAND", { id });

        revalidatePath("/admin/brands");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete brand:", error);
        return { success: false, error: error.message || "Failed to delete brand." };
    }
}
