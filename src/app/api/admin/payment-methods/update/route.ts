import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const id = (formData.get("id") as string)?.trim();
        const name = (formData.get("name") as string)?.trim();
        const summary = (formData.get("summary") as string)?.trim() ?? "";

        if (!id || !name) {
            return NextResponse.json(
                { success: false, error: "Payment method id and name are required." },
                { status: 400 }
            );
        }

        await db.collection("paymentMethods").doc(id).update({
            name,
            summary,
        });

        revalidatePath("/admin/payment-methods");
        revalidatePath(`/admin/payment-methods/edit/${id}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update payment method:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update payment method." },
            { status: 500 }
        );
    }
}
