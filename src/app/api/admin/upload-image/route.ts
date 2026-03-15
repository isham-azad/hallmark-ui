export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { uploadSingleImage } from "@/lib/cloudinary";
import { withAdminAuth } from "@/lib/api-middleware";

async function handler(request: Request) {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file || !file.size || !file.type.startsWith("image/")) {
        return NextResponse.json(
            { success: false, error: "Valid image file required." },
            { status: 400 }
        );
    }

    const allowedFolders = ["brands", "categories"];
    if (!allowedFolders.includes(folder)) {
        return NextResponse.json(
            { success: false, error: "Invalid folder." },
            { status: 400 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadSingleImage(buffer, file.type, folder);

    return NextResponse.json({ success: true, url });
}

export const POST = withAdminAuth(handler);
