import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            message,
            product
        } = body as {
            name: string;
            email?: string;
            phone: string;
            message: string;
            product?: {
                id: string;
                name: string;
                category?: string;
                image?: string;
            }
        };

        if (!name || !phone || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: name, phone, message." },
                { status: 400 }
            );
        }

        const enquiryData = {
            name: name.trim(),
            email: email ? email.trim() : null,
            phone: phone.trim(),
            message: message.trim(),
            product: product || null,
            status: "New",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("enquiries").add(enquiryData);

        return NextResponse.json({
            success: true,
            id: docRef.id
        });
    } catch (error) {
        console.error("Submit enquiry error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit enquiry. Please try again." },
            { status: 500 }
        );
    }
}
