export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const PaymentMethodSchema = z.object({
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
        .replace(/^-|-$/g, "") || "payment-method";
}

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() ?? "";

    const validation = PaymentMethodSchema.safeParse({ name, summary });
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const id = slugify(name);

    await db.collection("paymentMethods").doc(id).set({
        name,
        summary,
    });

    revalidatePath("/admin/payment-methods");

    await logAction("CREATE_PAYMENT_METHOD", { name });

    return NextResponse.json({ success: true });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_PAYMENTS);
