import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";

const ALLOWED_PINCODES_DOC = "delivery";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const pincode = request.nextUrl.searchParams.get("pincode");
        const normalized = typeof pincode === "string"
            ? pincode.trim().replace(/\D/g, "").slice(0, 6)
            : "";
        if (normalized.length !== 6) {
            return NextResponse.json(
                { available: false, error: "Please enter a valid 6-digit pincode" },
                { status: 400 }
            );
        }
        const doc = await db.collection("settings").doc(ALLOWED_PINCODES_DOC).get();
        const data = doc.data();
        const list = (data?.allowedPincodes as string[] | undefined) ?? [];
        const allowed = Array.isArray(list)
            ? list.filter((p) => typeof p === "string" && /^\d{6}$/.test(p))
            : [];
        const available = allowed.includes(normalized);
        return NextResponse.json({ available });
    } catch (error) {
        console.error("Check pincode error:", error);
        return NextResponse.json(
            { available: false, error: "Unable to check pincode" },
            { status: 500 }
        );
    }
}
