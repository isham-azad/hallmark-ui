import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/firebase";

export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "QR Code ID is required" }, { status: 400 });
        }

        const snapshot = await db.collection("qr_codes").doc(id).collection("scans").orderBy("timestamp", "desc").get();
        const scans = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ scans });
    } catch (error) {
        console.error("Error fetching QR scans:", error);
        return NextResponse.json({ error: "Failed to fetch QR scans" }, { status: 500 });
    }
}, PERMISSIONS.MANAGE_QR_CODES);
