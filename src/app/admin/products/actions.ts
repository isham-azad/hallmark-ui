"use server";

import db from "@/lib/firebase";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
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

const MAX_IMAGES = 5;

function slugifyFolder(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "product";
}

async function uploadImagesToCloudinary(files: File[], folderName: string): Promise<string[]> {
    const urls: string[] = [];
    const toSave = files.filter((f) => f && f.size > 0).slice(0, MAX_IMAGES);

    for (let i = 0; i < toSave.length; i++) {
        const file = toSave[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64, {
            folder: `hallmark/products/${folderName}`,
            public_id: `${i + 1}`,
            overwrite: true,
        });

        urls.push(result.secure_url);
    }

    return urls;
}

async function deleteImagesFromCloudinary(imageField: string | null): Promise<void> {
    if (!imageField) return;
    const urls = imageField.split(",").map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;

    let folderPath = "";

    for (const url of urls) {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        if (match) {
            const publicId = match[1];
            if (!folderPath) {
                folderPath = publicId.substring(0, publicId.lastIndexOf("/"));
            }
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.warn("Could not delete Cloudinary image:", publicId, err);
            }
        }
    }

    if (folderPath) {
        try {
            await cloudinary.api.delete_folder(folderPath);
        } catch (err) {
            console.warn("Could not delete Cloudinary folder:", folderPath, err);
        }
    }
}

export async function createProductWithUpload(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRODUCTS);
        
        const title = (formData.get("title") as string)?.trim();
        const desc = (formData.get("desc") as string)?.trim() ?? "";
        const brandId = (formData.get("brandId") as string) ?? "";
        const categoryId = (formData.get("categoryId") as string) ?? "";
        const price = (formData.get("price") as string)?.trim() || null;
        const sku = (formData.get("sku") as string)?.trim() || null;
        const stock = parseInt((formData.get("stock") as string) || "0", 10) || 0;
        const howToUse = (formData.get("howToUse") as string)?.trim() ?? "";
        const itemWeight = (formData.get("itemWeight") as string)?.trim() ?? "";
        const itemDimensions = (formData.get("itemDimensions") as string)?.trim() ?? "";
        const scent = (formData.get("scent") as string)?.trim() ?? "";
        const skinType = (formData.get("skinType") as string)?.trim() ?? "";
        const itemPackageQuantity = (formData.get("itemPackageQuantity") as string)?.trim() ?? "";
        const productBenefits = (formData.get("productBenefits") as string)?.trim() ?? "";
        const specialFeature = (formData.get("specialFeature") as string)?.trim() ?? "";
        const itemForm = (formData.get("itemForm") as string)?.trim() ?? "";
        const numberOfItems = (formData.get("numberOfItems") as string)?.trim() ?? "";
        
        const specsJson = formData.get("specifications") as string;
        const specifications = specsJson ? JSON.parse(specsJson) : [];

        if (!title || !brandId || !categoryId) {
            return { success: false, error: "Title, Brand and Category are required." };
        }

        const productId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "product";
        const folderName = sku ? slugifyFolder(sku) : slugifyFolder(productId);

        const files = formData.getAll("images") as File[];
        const imageUrls = await uploadImagesToCloudinary(files, folderName);
        const imageValue = imageUrls.length > 0 ? imageUrls.join(",") : null;

        await db.collection("products").doc(productId).set({
            title,
            desc,
            image: imageValue,
            price,
            wasPrice: null,
            sku,
            stock,
            brandId,
            categoryId,
            howToUse,
            itemWeight,
            itemDimensions,
            scent,
            skinType,
            itemPackageQuantity,
            productBenefits,
            specialFeature,
            itemForm,
            numberOfItems,
            specifications: specifications || [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "CREATE_PRODUCT", { title, productId });

        revalidatePath("/admin/products");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create product with upload:", error);
        return { success: false, error: error.message || "Failed to create product." };
    }
}

export async function createProduct(formData: { 
    id: string; title: string; desc: string; howToUse?: string; image?: string; price?: string; wasPrice?: string; sku?: string; stock?: number; brandId: string; categoryId: string;
    itemWeight?: string; itemDimensions?: string; scent?: string; skinType?: string; itemPackageQuantity?: string; productBenefits?: string; specialFeature?: string; itemForm?: string; numberOfItems?: string;
    specifications?: { name: string; value: string }[];
}) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRODUCTS);
        const docId = formData.id || formData.title.toLowerCase().replace(/\s+/g, "-");

        await db.collection("products").doc(docId).set({
            title: formData.title,
            desc: formData.desc,
            image: formData.image || null,
            price: formData.price || null,
            wasPrice: formData.wasPrice || null,
            sku: formData.sku || null,
            stock: formData.stock || 0,
            brandId: formData.brandId,
            categoryId: formData.categoryId,
            howToUse: formData.howToUse ?? "",
            itemWeight: formData.itemWeight ?? "",
            itemDimensions: formData.itemDimensions ?? "",
            scent: formData.scent ?? "",
            skinType: formData.skinType ?? "",
            itemPackageQuantity: formData.itemPackageQuantity ?? "",
            productBenefits: formData.productBenefits ?? "",
            specialFeature: formData.specialFeature ?? "",
            itemForm: formData.itemForm ?? "",
            numberOfItems: formData.numberOfItems ?? "",
            specifications: formData.specifications || [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "CREATE_PRODUCT", { title: formData.title, docId });

        revalidatePath("/admin/products");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create product:", error);
        return { success: false, error: error.message || "Failed to create product." };
    }
}

export async function updateProduct(id: string, formData: { 
    title: string; desc: string; howToUse?: string; image?: string; price?: string; wasPrice?: string; sku?: string; stock?: number; brandId: string; categoryId: string;
    itemWeight?: string; itemDimensions?: string; scent?: string; skinType?: string; itemPackageQuantity?: string; productBenefits?: string; specialFeature?: string; itemForm?: string; numberOfItems?: string;
    existingImages?: string; 
    specifications?: string;
}) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRODUCTS);
        await db.collection("products").doc(id).update({
            title: formData.title,
            desc: formData.desc,
            image: formData.image || null,
            price: formData.price || null,
            wasPrice: formData.wasPrice || null,
            sku: formData.sku || null,
            stock: formData.stock || 0,
            brandId: formData.brandId,
            categoryId: formData.categoryId,
            howToUse: formData.howToUse ?? "",
            itemWeight: formData.itemWeight ?? "",
            itemDimensions: formData.itemDimensions ?? "",
            scent: formData.scent ?? "",
            skinType: formData.skinType ?? "",
            itemPackageQuantity: formData.itemPackageQuantity ?? "",
            productBenefits: formData.productBenefits ?? "",
            specialFeature: formData.specialFeature ?? "",
            itemForm: formData.itemForm ?? "",
            numberOfItems: formData.numberOfItems ?? "",
            specifications: formData.specifications ? JSON.parse(formData.specifications) : [],
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_PRODUCT", { id, title: formData.title });

        revalidatePath("/admin/products");
        revalidatePath(`/admin/products/edit/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update product:", error);
        return { success: false, error: error.message || "Failed to update product." };
    }
}

export async function setProductStatus(id: string, status: "active" | "disabled") {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRODUCTS);
        await db.collection("products").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "SET_PRODUCT_STATUS", { id, status });

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update product status:", error);
        return { success: false, error: error.message || "Failed to update status." };
    }
}

export async function deleteProduct(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRODUCTS);
        const doc = await db.collection("products").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            await deleteImagesFromCloudinary(data?.image ?? null);
        }

        await db.collection("products").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_PRODUCT", { id });

        revalidatePath("/admin/products");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete product:", error);
        return { success: false, error: error.message || "Failed to delete product." };
    }
}

export async function updateProductPrice(id: string, price: string, wasPrice?: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRICES);
        await db.collection("products").doc(id).update({
            price,
            wasPrice: wasPrice || null,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_PRODUCT_PRICE", { id, price });

        revalidatePath("/admin/products/prices");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update price:", error);
        return { success: false, error: error.message || "Failed to update price." };
    }
}

export async function updateProductStock(id: string, sku: string, stock: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_INVENTORY);
        await db.collection("products").doc(id).update({
            sku: sku || null,
            stock: stock || 0,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_PRODUCT_STOCK", { id, sku, stock });

        revalidatePath("/admin/products/inventory");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update stock:", error);
        return { success: false, error: error.message || "Failed to update inventory." };
    }
}

export async function bulkUpdatePrices(discountType: "percentage" | "fixed", value: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_PRICES);
        const snapshot = await db.collection("products").get();
        const batch = db.batch();

        snapshot.docs.forEach((doc: any) => {
            const data = doc.data();
            if (!data.price) return;

            const currentPrice = parseFloat(data.price);
            if (isNaN(currentPrice)) return;

            let newPrice = currentPrice;
            if (discountType === "percentage") {
                newPrice = currentPrice - (currentPrice * (value / 100));
            } else if (discountType === "fixed") {
                newPrice = Math.max(0, currentPrice - value);
            }

            const newPriceStr = Number.isInteger(newPrice) ? newPrice.toString() : newPrice.toFixed(2);

            batch.update(doc.ref, {
                price: newPriceStr,
                wasPrice: data.price,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        await batch.commit();

        await logAction(session.email, session.name, "BULK_UPDATE_PRICES", { discountType, value });

        revalidatePath("/admin/products/prices");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to bulk update prices:", error);
        return { success: false, error: error.message || "Failed to apply bulk discount." };
    }
}
