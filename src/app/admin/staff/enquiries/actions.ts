"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";

export interface Enquiry {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    message: string;
    status: string;
    createdAt: string;
    product?: {
        id: string;
        name: string;
        category?: string;
        image?: string;
    } | null;
}

function toISO(val: unknown): string {
    if (val && typeof val === "object" && "toDate" in val) return (val as { toDate: () => Date }).toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "string") return val;
    return new Date().toISOString();
}

export async function getEnquiries(): Promise<Enquiry[]> {
    try {
        const snapshot = await db.collection("enquiries").orderBy("createdAt", "desc").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email ?? null,
                phone: data.phone,
                message: data.message,
                status: data.status || "New",
                createdAt: toISO(data.createdAt),
                product: data.product ?? null,
            };
        });
    } catch (error) {
        console.error("Failed to fetch enquiries:", error);
        return [];
    }
}

export async function updateEnquiryStatus(id: string, status: string) {
    try {
        await db.collection("enquiries").doc(id).update({ 
            status,
            updatedAt: new Date()
        });
        revalidatePath("/admin/staff/enquiries");
        return { success: true };
    } catch (error) {
        console.error("Failed to update enquiry status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteEnquiry(id: string) {
    try {
        await db.collection("enquiries").doc(id).delete();
        revalidatePath("/admin/staff/enquiries");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete enquiry:", error);
        return { success: false, error: "Failed to delete enquiry" };
    }
}
