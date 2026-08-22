import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

function sanitizeHtml(str: string): string {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            message,
            product,
            type
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
            };
            type?: string;
        };

        if (!name || !phone || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: name, phone, message." },
                { status: 400 }
            );
        }

        // --- Rate Limiting ---
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        
        // Key on IP address
        const rateLimitKey = `enquiry:${ip}`;
        const rateLimit = checkRateLimit(rateLimitKey, {
            maxAttempts: 5,
            windowMs: 60 * 60 * 1000, // 5 requests per hour
            blockDurationMs: 60 * 60 * 1000, // block for 1 hour
        });

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, error: "Too many enquiries submitted. Please try again later." },
                { status: 429 }
            );
        }

        const enquiryData = {
            name: sanitizeHtml(name.trim()),
            email: email ? sanitizeHtml(email.trim()) : null,
            phone: sanitizeHtml(phone.trim()),
            message: sanitizeHtml(message.trim()),
            product: product || null,
            type: type || null,
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
