import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const heroBannersSnap = await db.collection("hero_banners").orderBy("order", "asc").get();
        const heroBanners = heroBannersSnap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));

        const aboutUsDoc = await db.collection("website_settings").doc("about_us").get();
        const aboutUs = aboutUsDoc.exists ? aboutUsDoc.data() : null;

        const statsDoc = await db.collection("website_settings").doc("stats").get();
        const stats = statsDoc.exists ? statsDoc.data() : null;

        const [productsSnap, categoriesSnap] = await Promise.all([
            db.collection("products").count().get(),
            db.collection("categories").count().get(),
        ]);

        return NextResponse.json({
            heroBanners,
            aboutUs,
            stats,
            counts: {
                products: productsSnap.data().count,
                categories: categoriesSnap.data().count,
            }
        });
    } catch (error) {
        console.error("Site website-content API error:", error);
        return NextResponse.json({ heroBanners: [], aboutUs: null, stats: null }, { status: 500 });
    }
}
