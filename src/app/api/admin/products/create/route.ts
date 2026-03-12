import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

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

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const title = (formData.get("title") as string)?.trim();
        const desc = (formData.get("desc") as string)?.trim() ?? "";
        const brandId = (formData.get("brandId") as string) ?? "";
        const categoryId = (formData.get("categoryId") as string) ?? "";
        const price = (formData.get("price") as string)?.trim() || null;
        const sku = (formData.get("sku") as string)?.trim() || null;
        const stock = parseInt((formData.get("stock") as string) || "0", 10) || 0;

        if (!title || !brandId || !categoryId) {
            return NextResponse.json(
                { success: false, error: "Title, Brand and Category are required." },
                { status: 400 }
            );
        }

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
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/admin/products");
        revalidatePath("/admin");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to create product with upload:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create product." },
            { status: 500 }
        );
    }
}
