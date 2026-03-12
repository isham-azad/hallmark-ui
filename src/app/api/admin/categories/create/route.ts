import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { uploadSingleImage } from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "category";
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = (formData.get("name") as string)?.trim();
        const summary = (formData.get("summary") as string)?.trim() ?? "";
        const file = formData.get("image") as File | null;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "Category name is required." },
                { status: 400 }
            );
        }

        const id = slugify(name);
        let imageUrl: string | null = null;

        if (file && file.size > 0 && file.type.startsWith("image/")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            imageUrl = await uploadSingleImage(
                buffer,
                file.type,
                `categories/${id}`,
                "logo"
            );
        }

        await db.collection("categories").doc(id).set({
            name,
            summary,
            image: imageUrl,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath("/admin/categories");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create category." },
            { status: 500 }
        );
    }
}
