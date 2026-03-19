import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body as { email: string };

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email is required." },
                { status: 400 }
            );
        }

        const emailStr = email.trim();
        const snapshot = await db.collection("customers").where("email", "==", emailStr).get();

        if (!snapshot.empty) {
            // Update existing customer(s)
            const batch = db.batch();
            let alreadySubscribed = false;

            for (const doc of snapshot.docs) {
                if (doc.data().subscribed) {
                    alreadySubscribed = true;
                } else {
                    batch.update(doc.ref, { 
                        subscribed: true,
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }
            }

            if (alreadySubscribed && snapshot.docs.length === 1) {
                return NextResponse.json(
                    { success: false, error: "Email is already subscribed." },
                    { status: 400 }
                );
            }

            await batch.commit();
        } else {
            // Add as a new customer with the subscribed flag
            await db.collection("customers").add({
                email: emailStr,
                subscribed: true,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to subscribe. Please try again." },
            { status: 500 }
        );
    }
}
