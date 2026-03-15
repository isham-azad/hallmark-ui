"use server";

import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function createPaymentMethod(formData: { id: string; name: string; summary: string }) {
    try {
        const docId = formData.id || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-");

        await db.collection("paymentMethods").doc(docId).set({
            name: formData.name,
            summary: formData.summary,
        });

        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to create payment method:", error);
        return { success: false, error: "Failed to create payment method. The ID might already exist." };
    }
}

export async function updatePaymentMethod(id: string, formData: { name: string; summary: string }) {
    try {
        await db.collection("paymentMethods").doc(id).update({
            name: formData.name,
            summary: formData.summary,
        });

        revalidatePath("/admin/staff/payment-methods");
        revalidatePath(`/admin/staff/payment-methods/edit/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment method:", error);
        return { success: false, error: "Failed to update payment method." };
    }
}

export async function setPaymentMethodStatus(id: string, status: "active" | "disabled") {
    try {
        await db.collection("paymentMethods").doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment method status:", error);
        return { success: false, error: "Failed to update status." };
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        await db.collection("paymentMethods").doc(id).delete();
        revalidatePath("/admin/staff/payment-methods");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete payment method:", error);
        return { success: false, error: "Failed to delete payment method." };
    }
}
