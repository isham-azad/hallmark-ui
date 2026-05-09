export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { uploadSingleImage } from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const BrandSchema = z.object({
    name: z.string().min(1).max(100),
    summary: z.string().optional(),
    shortDesc: z.string().optional(),
});

function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "brand";
}

async function uploadMultipleImages(files: File[], folder: string, prefix: string): Promise<string> {
    const urls: string[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.size > 0 && file.type.startsWith("image/")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const url = await uploadSingleImage(
                buffer,
                file.type,
                folder,
                `${prefix}-${timestamp}-${i + 1}`
            );
            urls.push(url);
        }
    }
    return urls.join(",");
}

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";
    const shortDesc = (formData.get("shortDesc") as string)?.trim() ?? "";
    const file = formData.get("image") as File | null;
    const bannerFiles = formData.getAll("banner") as File[];
    const bannerMobileFiles = formData.getAll("bannerMobile") as File[];

    const validation = BrandSchema.safeParse({ name, summary, shortDesc });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const id = slugify(name);
    let imageUrl: string | null = null;
    let bannerUrl: string | null = null;
    let bannerMobileUrl: string | null = null;

    if (file && file.size > 0 && file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageUrl = await uploadSingleImage(buffer, file.type, `brands/${id}`, "logo");
    }

    if (bannerFiles.length > 0 && bannerFiles[0].size > 0) {
        bannerUrl = await uploadMultipleImages(bannerFiles.slice(0, 5), `brands/${id}`, "banner");
    }

    if (bannerMobileFiles.length > 0 && bannerMobileFiles[0].size > 0) {
        bannerMobileUrl = await uploadMultipleImages(bannerMobileFiles.slice(0, 5), `brands/${id}`, "mobile-banner");
    }

    await db.collection("brands").doc(id).set({
        name,
        summary,
        shortDesc,
        image: imageUrl,
        banner: bannerUrl,
        bannerMobile: bannerMobileUrl,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/admin/brands");
    revalidatePath("/");
    revalidatePath(`/brand/${id}`);

    await logAction("CREATE_BRAND", { brandId: id, name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_BRANDS);
