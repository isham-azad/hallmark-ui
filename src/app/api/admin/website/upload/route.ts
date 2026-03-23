import { NextResponse } from "next/server";
import { uploadSingleImage } from "@/lib/cloudinary";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

async function handler(request: Request) {
    try {
        const formData = await request.formData();
        const folder = (formData.get("folder") as string) || "website";
        const files = formData.getAll("images") as Blob[];
        
        const imageUrls: string[] = [];
        for (const blob of files) {
            if (!blob || blob.size === 0) continue;
            const buffer = Buffer.from(await blob.arrayBuffer());
            const url = await uploadSingleImage(buffer, blob.type, folder);
            imageUrls.push(url);
        }
        
        return NextResponse.json({ success: true, urls: imageUrls });
    } catch (error: any) {
        console.error("Website upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_WEBSITE);
