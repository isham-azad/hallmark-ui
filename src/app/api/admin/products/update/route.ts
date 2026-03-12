export const dynamic = "force-dynamic";
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

        const id = (formData.get("id") as string)?.trim();
        const title = (formData.get("title") as string)?.trim();
        const desc = (formData.get("desc") as string)?.trim() ?? "";
        const brandId = (formData.get("brandId") as string) ?? "";
        const categoryId = (formData.get("categoryId") as string) ?? "";
        const price = (formData.get("price") as string)?.trim() || null;
        const wasPrice = (formData.get("wasPrice") as string)?.trim() || null;
        const sku = (formData.get("sku") as string)?.trim() || null;
        const stock = parseInt((formData.get("stock") as string) || "0", 10) || 0;
        const existingImagesRaw = (formData.get("existingImages") as string) ?? "";

        if (!id || !title || !brandId || !categoryId) {
            return NextResponse.json(
                { success: false, error: "ID, Title, Brand and Category are required." },
                { status: 400 }
            );
        }

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
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/admin/products");
        revalidatePath("/admin/products/edit/" + id);
        revalidatePath("/admin");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update product:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update product." },
            { status: 500 }
        );
    }
}
