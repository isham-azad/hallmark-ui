import { NextResponse } from "next/server";
import admin from "firebase-admin";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    try {
        const db = admin.apps.length ? admin.firestore() : null;
        if (!db) {
            console.error("Firebase not initialized in redirect route");
            return NextResponse.redirect(new URL("/", req.url));
        }

        const qrRef = db.collection("qr_codes").doc(id);
        const doc = await qrRef.get();

        if (!doc.exists) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        const data = doc.data();

        // Extract tracking data
        const userAgent = req.headers.get("user-agent") || "Unknown";
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "Unknown";
        
        // Use a batch to increment scan count and log the scan details simultaneously
        const batch = db.batch();
        
        batch.update(qrRef, {
            scanCount: admin.firestore.FieldValue.increment(1)
        });

        const newScanRef = qrRef.collection("scans").doc();
        batch.set(newScanRef, {
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        });

        await batch.commit();

        const targetUrl = data?.url || "/";
        
        // If it's an internal relative path, resolve it with req.url, otherwise use it directly
        const redirectUrl = targetUrl.startsWith("/") || targetUrl.startsWith("http") 
            ? targetUrl 
            : `/${targetUrl}`;

        // Create an absolute URL if it's relative
        const finalUrl = new URL(redirectUrl, req.url).toString();

        return NextResponse.redirect(finalUrl);

    } catch (error) {
        console.error("Error handling QR redirect:", error);
        return NextResponse.redirect(new URL("/", req.url));
    }
}
