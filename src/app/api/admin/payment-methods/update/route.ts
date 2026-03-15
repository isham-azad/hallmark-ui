export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const PaymentMethodUpdateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    summary: z.string().optional(),
});

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const id = (formData.get("id") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";

    const validation = PaymentMethodUpdateSchema.safeParse({ id, name, summary });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    await db.collection("paymentMethods").doc(id).update({
        name,
        summary,
    });

    revalidatePath("/admin/payment-methods");
    revalidatePath(`/admin/payment-methods/edit/${id}`);

    await logAction("UPDATE_PAYMENT_METHOD", { id, name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_PAYMENTS);
