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

// Schema for basic field validation
const ProductSchema = z.object({
    title: z.string().min(3).max(100),
    brandId: z.string().min(1),
    categoryId: z.string().min(1),
    price: z.string().nullable(),
    sku: z.string().nullable(),
    stock: z.number().min(0).default(0),
    howToUse: z.string().optional(),
    b2bPricingTiers: z.array(z.object({
        minQty: z.number().min(1),
        price: z.string()
    })).optional(),
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
        title: (formData.get("title") as string)?.trim(),
        brandId: (formData.get("brandId") as string) ?? "",
        categoryId: (formData.get("categoryId") as string) ?? "",
        price: (formData.get("price") as string)?.trim() || null,
        sku: (formData.get("sku") as string)?.trim() || null,
        stock: parseInt((formData.get("stock") as string) || "0", 10) || 0,
        howToUse: (formData.get("howToUse") as string)?.trim() ?? "",
        b2bPricingTiers: formData.get("b2bPricingTiers") ? JSON.parse(formData.get("b2bPricingTiers") as string) : [],
    };

    // Validate with Zod
    const validation = ProductSchema.safeParse(rawData);
    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: validation.error.issues[0].message },
            { status: 400 }
        );
    }

    const { title, brandId, categoryId, price, sku, stock, howToUse } = validation.data;
    const desc = (formData.get("desc") as string)?.trim() ?? "";

    const productId = title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "product";
        
    const folderName = sku ? slugifyFolder(sku) : slugifyFolder(productId);

    const imageUrls: string[] = [];
    const files = formData.getAll("images") as Blob[];
    const toSave = files
        .filter((f) => f && f.size > 0 && f.type.startsWith("image/"))
        .slice(0, MAX_IMAGES);

    for (let i = 0; i < toSave.length; i++) {
        const blob = toSave[i];
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = `data:${blob.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64, {
            folder: `hallmark/products/${folderName}`,
            public_id: `${i + 1}`,
            overwrite: true,
        });

        imageUrls.push(result.secure_url);
    }

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
        howToUse: howToUse ?? "",
        b2bPricingTiers: validation.data.b2bPricingTiers || [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin");

    // Audit Log
    await logAction("CREATE_PRODUCT", {
        productId,
        title,
        brandId,
        categoryId
    });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_PRODUCTS);
