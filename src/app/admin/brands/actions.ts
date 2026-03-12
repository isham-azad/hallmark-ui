"use server";

import db from "@/lib/firebase";
import { deleteImageByUrl, deleteFolder } from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function createBrand(formData: { id: string; name: string; summary: string; image?: string }) {
    try {
        const docId = formData.id || formData.name.toLowerCase().replace(/\s+/g, "-");

        await db.collection("brands").doc(docId).set({
            name: formData.name,
            summary: formData.summary,
            image: formData.image || null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/admin/brands");
        return { success: true };
    } catch (error) {
        console.error("Failed to create brand:", error);
        return { success: false, error: "Failed to create brand. The ID might already exist." };
    }
}

export async function updateBrand(id: string, formData: { name: string; summary: string; image?: string }) {
    try {
        await db.collection("brands").doc(id).update({
            name: formData.name,
            summary: formData.summary,
            image: formData.image || null,
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/admin/brands");
        revalidatePath(`/admin/brands/edit/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update brand:", error);
        return { success: false, error: "Failed to update brand." };
    }
}

export async function setBrandStatus(id: string, status: "active" | "disabled") {
    try {
        await db.collection("brands").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath("/admin/brands");
        return { success: true };
    } catch (error) {
        console.error("Failed to update brand status:", error);
        return { success: false, error: "Failed to update status." };
    }
}

export async function deleteBrand(id: string) {
    try {
        const productsSnap = await db.collection("products").where("brandId", "==", id).limit(1).get();

        if (!productsSnap.empty) {
            return { success: false, error: "Cannot delete brand that has associated products. Remove products first." };
        }

        const doc = await db.collection("brands").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            const img = data?.image;
            if (img && typeof img === "string" && img.includes("cloudinary")) {
                try {
                    await deleteImageByUrl(img);
                } catch (err) {
                    console.warn("Could not delete brand image from Cloudinary:", err);
                }
            }
            try {
                await deleteFolder(`hallmark/brands/${id}`);
            } catch (err) {
                console.warn("Could not delete brand folder from Cloudinary:", err);
            }
        }

        await db.collection("brands").doc(id).delete();
        revalidatePath("/admin/brands");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete brand:", error);
        return { success: false, error: "Failed to delete brand." };
    }
}
