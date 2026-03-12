import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { uploadSingleImage } from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const id = (formData.get("id") as string)?.trim();
        const name = (formData.get("name") as string)?.trim();
        const summary = (formData.get("summary") as string)?.trim() ?? "";
        const file = formData.get("image") as File | null;

        if (!id || !name) {
            return NextResponse.json(
                { success: false, error: "Category id and name are required." },
                { status: 400 }
            );
        }

        const updateData: { name: string; summary: string; updatedAt: ReturnType<typeof FieldValue.serverTimestamp>; image?: string | null } = {
            name,
            summary,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (file && file.size > 0 && file.type.startsWith("image/")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const imageUrl = await uploadSingleImage(
                buffer,
                file.type,
                `categories/${id}`,
                "logo"
            );
            updateData.image = imageUrl;
        }

        await db.collection("categories").doc(id).update(updateData);

        revalidatePath("/admin/categories");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update category:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update category." },
            { status: 500 }
        );
    }
}
