import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";

function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "payment-method";
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = (formData.get("name") as string)?.trim();
        const summary = (formData.get("summary") as string)?.trim() ?? "";

        if (!name) {
            return NextResponse.json(
                { success: false, error: "Payment method name is required." },
                { status: 400 }
            );
        }

        const id = slugify(name);

        await db.collection("paymentMethods").doc(id).set({
            name,
            summary,
        });

        revalidatePath("/admin/payment-methods");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to create payment method:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create payment method." },
            { status: 500 }
        );
    }
}
