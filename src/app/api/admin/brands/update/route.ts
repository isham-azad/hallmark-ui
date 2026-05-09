export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { uploadSingleImage } from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const BrandUpdateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    summary: z.string().optional(),
    shortDesc: z.string().optional(),
});

async function uploadMultipleImages(files: File[], folder: string, prefix: string): Promise<string[]> {
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
    return urls;
}

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const id = (formData.get("id") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";
    const shortDesc = (formData.get("shortDesc") as string)?.trim() ?? "";
    
    const file = formData.get("image") as File | null;
    const bannerFiles = formData.getAll("banner") as File[];
    const bannerMobileFiles = formData.getAll("bannerMobile") as File[];

    const validation = BrandUpdateSchema.safeParse({ id, name, summary, shortDesc });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const updateData: any = {
        name,
        summary,
        shortDesc,
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Handle single logo image
    if (formData.has("image") && formData.get("image") === "") updateData.image = null;
    if (file && file.size > 0 && file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await uploadSingleImage(buffer, file.type, `brands/${id}`, "logo");
        updateData.image = imageUrl;
    }

    // Handle multiple desktop banners
    const existingBanner = formData.get("existingBanner") as string;
    let bannerUrls: string[] = existingBanner ? existingBanner.split(',').filter(Boolean) : [];
    
    if (bannerFiles.length > 0 && bannerFiles[0].size > 0) {
        const newUrls = await uploadMultipleImages(bannerFiles.slice(0, 5 - bannerUrls.length), `brands/${id}`, "banner");
        bannerUrls = [...bannerUrls, ...newUrls];
    }
    
    if (formData.has("banner") && formData.get("banner") === "" && bannerFiles.length === 0) {
        updateData.banner = null;
    } else {
        updateData.banner = bannerUrls.join(",") || null;
    }

    // Handle multiple mobile banners
    const existingBannerMobile = formData.get("existingBannerMobile") as string;
    let mobBannerUrls: string[] = existingBannerMobile ? existingBannerMobile.split(',').filter(Boolean) : [];

    if (bannerMobileFiles.length > 0 && bannerMobileFiles[0].size > 0) {
        const newMobUrls = await uploadMultipleImages(bannerMobileFiles.slice(0, 5 - mobBannerUrls.length), `brands/${id}`, "mobile-banner");
        mobBannerUrls = [...mobBannerUrls, ...newMobUrls];
    }

    if (formData.has("bannerMobile") && formData.get("bannerMobile") === "" && bannerMobileFiles.length === 0) {
        updateData.bannerMobile = null;
    } else {
        updateData.bannerMobile = mobBannerUrls.join(",") || null;
    }

    await db.collection("brands").doc(id).update(updateData);

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/edit/${id}`);
    revalidatePath(`/brand/${id}`);
    revalidatePath("/");

    await logAction("UPDATE_BRAND", { brandId: id, name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_BRANDS);
