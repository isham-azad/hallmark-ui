import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/firebase";

export const GET = withAdminAuth(async () => {
    try {
        const snapshot = await db.collection("qr_codes").orderBy("createdAt", "desc").get();
        const qrCodes = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ qrCodes });
    } catch (error) {
        console.error("Error fetching QR codes:", error);
        return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 });
    }
}, PERMISSIONS.MANAGE_QR_CODES);

export const POST = withAdminAuth(async (req, { logAction }) => {
    try {
        const { name, url } = await req.json();

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
        }

        // Generate a random 6-character short code
        const shortCode = Math.random().toString(36).substring(2, 8);

        const newQrCode = {
            name,
            url,
            scanCount: 0,
            createdAt: new Date().toISOString(),
            shortCode,
        };

        await db.collection("qr_codes").doc(shortCode).set(newQrCode);

        await logAction("Created QR Code", { shortCode, name, url });

        return NextResponse.json({ message: "QR Code created successfully", qrCode: { id: shortCode, ...newQrCode } }, { status: 201 });
    } catch (error) {
        console.error("Error creating QR code:", error);
        return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 });
    }
}, PERMISSIONS.MANAGE_QR_CODES);

export const DELETE = withAdminAuth(async (req, { logAction }) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await db.collection("qr_codes").doc(id).delete();

        await logAction("Deleted QR Code", { shortCode: id });

        return NextResponse.json({ message: "QR Code deleted successfully" });
    } catch (error) {
        console.error("Error deleting QR code:", error);
        return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 });
    }
}, PERMISSIONS.MANAGE_QR_CODES);
