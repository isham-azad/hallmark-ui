import { getSeoSettings } from "./actions";
import SeoClient from "./SeoClient";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

function serialize(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(serialize);
    const out: any = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === "object" && "_seconds" in val) {
            out[key] = new Date(val._seconds * 1000).toISOString();
        } else if (val && typeof val.toDate === "function") {
            out[key] = val.toDate().toISOString();
        } else if (val && typeof val === "object") {
            out[key] = serialize(val);
        } else {
            out[key] = val;
        }
    }
    return out;
}

export default async function SeoSetupPage() {
    const seoSettings = await getSeoSettings();
    
    // Fetch products sorted by title
    let products: any[] = [];
    try {
        const snapshot = await db.collection("products").orderBy("title").get();
        products = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            title: doc.data().title || "Untitled Product",
            image: doc.data().image || "",
            desc: doc.data().desc || "",
        }));
    } catch (e) {
        console.error("Failed to fetch products for SEO page:", e);
    }

    return <SeoClient initialData={serialize(seoSettings)} products={serialize(products)} />;
}
