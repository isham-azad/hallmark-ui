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
});

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const id = (formData.get("id") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";
    const file = formData.get("image") as File | null;
    const bannerFile = formData.get("banner") as File | null;
    const bannerMobileFile = formData.get("bannerMobile") as File | null;

    const validation = BrandUpdateSchema.safeParse({ id, name, summary });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const updateData: any = {
        name,
        summary,
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Handle removals
    if (formData.has("image") && formData.get("image") === "") updateData.image = null;
    if (formData.has("banner") && formData.get("banner") === "") updateData.banner = null;
    if (formData.has("bannerMobile") && formData.get("bannerMobile") === "") updateData.bannerMobile = null;

    if (file && file.size > 0 && file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await uploadSingleImage(
            buffer,
            file.type,
            `brands/${id}`,
            "logo"
        );
        updateData.image = imageUrl;
    }

    if (bannerFile && bannerFile.size > 0 && bannerFile.type.startsWith("image/")) {
        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        const bannerUrl = await uploadSingleImage(
            buffer,
            bannerFile.type,
            `brands/${id}`,
            "banner"
        );
        updateData.banner = bannerUrl;
    }

    if (bannerMobileFile && bannerMobileFile.size > 0 && bannerMobileFile.type.startsWith("image/")) {
        const buffer = Buffer.from(await bannerMobileFile.arrayBuffer());
        const bannerMobileUrl = await uploadSingleImage(
            buffer,
            bannerMobileFile.type,
            `brands/${id}`,
            "mobile-banner"
        );
        updateData.bannerMobile = bannerMobileUrl;
    }

    await db.collection("brands").doc(id).update(updateData);

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/edit/${id}`);

    await logAction("UPDATE_BRAND", { brandId: id, name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_BRANDS);
