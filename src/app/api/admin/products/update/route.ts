export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const MAX_IMAGES = 5;

const UpdateProductSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(3).max(100),
    brandId: z.string().min(1),
    categoryId: z.string().min(1),
    price: z.string().nullable(),
    wasPrice: z.string().nullable(),
    sku: z.string().nullable(),
    stock: z.number().min(0),
    howToUse: z.string().optional(),
    b2bPricingTiers: z.array(z.object({
        minQty: z.number().min(1),
        price: z.string()
    })).optional(),
    isReturnable: z.boolean().default(true),
    isDeliveredByHallmark: z.boolean().default(true),
    isFreeDelivery: z.boolean().default(false),
    isSecureTransaction: z.boolean().default(true),
});

function slugifyFolder(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "product";
}

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();

    const rawData = {
        id: (formData.get("id") as string)?.trim(),
        title: (formData.get("title") as string)?.trim(),
        brandId: (formData.get("brandId") as string) ?? "",
        categoryId: (formData.get("categoryId") as string) ?? "",
        price: (formData.get("price") as string)?.trim() || null,
        wasPrice: (formData.get("wasPrice") as string)?.trim() || null,
        sku: (formData.get("sku") as string)?.trim() || null,
        stock: parseInt((formData.get("stock") as string) || "0", 10) || 0,
        howToUse: (formData.get("howToUse") as string)?.trim() ?? "",
        b2bPricingTiers: formData.get("b2bPricingTiers") ? JSON.parse(formData.get("b2bPricingTiers") as string) : [],
        isReturnable: formData.get("isReturnable") === "true",
        isDeliveredByHallmark: formData.get("isDeliveredByHallmark") === "true",
        isFreeDelivery: formData.get("isFreeDelivery") === "true",
        isSecureTransaction: formData.get("isSecureTransaction") === "true",
    };

    const validation = UpdateProductSchema.safeParse(rawData);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const { id, title, brandId, categoryId, price, wasPrice, sku, stock, howToUse } = validation.data;
    const desc = (formData.get("desc") as string)?.trim() ?? "";
    const existingImagesRaw = (formData.get("existingImages") as string) ?? "";

    const existingUrls = existingImagesRaw
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

    const folderName = sku ? slugifyFolder(sku) : id;

    const newFiles = formData.getAll("images") as Blob[];
    const toUpload = newFiles
        .filter((f) => f && f.size > 0 && (f as File).type?.startsWith?.("image/"))
        .slice(0, MAX_IMAGES - existingUrls.length);

    const newUrls: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
        const blob = toUpload[i];
        const buffer = Buffer.from(await blob.arrayBuffer());
        const type = (blob as File).type || "image/jpeg";
        const base64 = `data:${type};base64,${buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64, {
            folder: `hallmark/products/${folderName}`,
            public_id: `${existingUrls.length + i + 1}`,
            overwrite: true,
        });
        newUrls.push(result.secure_url);
    }

    const allUrls = [...existingUrls, ...newUrls];
    const imageValue = allUrls.length > 0 ? allUrls.join(",") : null;

    await db.collection("products").doc(id).update({
        title,
        desc,
        image: imageValue,
        price,
        wasPrice,
        sku,
        stock,
        brandId,
        categoryId,
        howToUse: howToUse ?? "",
        b2bPricingTiers: validation.data.b2bPricingTiers || [],
        isReturnable: validation.data.isReturnable,
        isDeliveredByHallmark: validation.data.isDeliveredByHallmark,
        isFreeDelivery: validation.data.isFreeDelivery,
        isSecureTransaction: validation.data.isSecureTransaction,
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/products/edit/" + id);
    revalidatePath("/admin");

    // Audit Log
    await logAction("UPDATE_PRODUCT", { productId: id, title });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_PRODUCTS);
