import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("shop_banners").orderBy("order", "asc").get();
        const banners = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return NextResponse.json({ banners });
    } catch (error) {
        console.error("Site shop-banners API error:", error);
        return NextResponse.json({ banners: [] });
    }
}
