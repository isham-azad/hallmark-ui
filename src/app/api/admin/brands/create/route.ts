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

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";
    const file = formData.get("image") as File | null;
    const bannerFile = formData.get("banner") as File | null;

    const validation = BrandSchema.safeParse({ name, summary });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const id = slugify(name);
    let imageUrl: string | null = null;
    let bannerUrl: string | null = null;

    if (file && file.size > 0 && file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageUrl = await uploadSingleImage(
            buffer,
            file.type,
            `brands/${id}`,
            "logo"
        );
    }

    if (bannerFile && bannerFile.size > 0 && bannerFile.type.startsWith("image/")) {
        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        bannerUrl = await uploadSingleImage(
            buffer,
            bannerFile.type,
            `brands/${id}`,
            "banner"
        );
    }

    await db.collection("brands").doc(id).set({
        name,
        summary,
        image: imageUrl,
        banner: bannerUrl,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/admin/brands");

    await logAction("CREATE_BRAND", { brandId: id, name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_BRANDS);
