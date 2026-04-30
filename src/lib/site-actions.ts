"use server";
import db from "@/lib/firebase";

export async function getSiteWebsiteContent() {
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

        return {
            heroBanners,
            aboutUs,
            stats,
            counts: {
                products: productsSnap.data().count,
                categories: categoriesSnap.data().count,
            }
        };
    } catch (error) {
        console.error("Fetch site-website-content error:", error);
        return { heroBanners: [], aboutUs: null, stats: null };
    }
}

export async function getSiteProducts(limitCount?: number) {
    try {
        let query = db.collection("products");
        
        if (limitCount) {
            query = query.limit(limitCount * 2); // Fetch slightly more to account for in-memory filtering
        }

        const snapshot = await query.get();
        
        const categorySnap = await db.collection("categories").get();
        const brandSnap = await db.collection("brands").get();

        const categoryNames: Record<string, string> = {};
        categorySnap.docs.forEach((d: any) => { categoryNames[d.id] = d.data().name; });
        const brandNames: Record<string, string> = {};
        brandSnap.docs.forEach((d: any) => { brandNames[d.id] = d.data().name; });

        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                
                return {
                    id: doc.id,
                    title: data.title,
                    desc: data.desc || "",
                    image: data.image || undefined,
                    price: data.price || undefined,
                    wasPrice: data.wasPrice || undefined,
                    category: data.categoryId,
                    brand: data.brandId,
                    categoryName: categoryNames[data.categoryId],
                    brandName: brandNames[data.brandId],
                    howToUse: data.howToUse || "",
                    b2bPricingTiers: data.b2bPricingTiers || [],
                    updatedAt: data.updatedAt?.toMillis?.() || 0,
                };
            })
            .filter((p: any): p is any => p !== null)
            // Sort by updatedAt descending in memory
            .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (error) {
        console.error("Fetch site-products error:", error);
        return [];
    }
}

export async function getSiteBrands() {
    try {
        const snapshot = await db.collection("brands").get();
        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return { id: doc.id, name: data.name, shortDesc: data.shortDesc || "", summary: data.summary || "", image: data.image || "" };
            })
            .filter(Boolean);
    } catch (error) {
        console.error("Fetch site-brands error:", error);
        return [];
    }
}

export async function getSiteCategories() {
    try {
        const snapshot = await db.collection("categories").get();
        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return { id: doc.id, name: data.name, summary: data.summary || "", image: data.image || "" };
            })
            .filter(Boolean);
    } catch (error) {
        console.error("Fetch site-categories error:", error);
        return [];
    }
}

export async function getSiteTestimonials() {
    try {
        const snapshot = await db.collection("testimonials").get();
        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return { 
                    id: doc.id, 
                    name: data.name, 
                    role: data.role, 
                    quote: data.quote, 
                    rating: data.rating || 5, 
                    createdAt: data.createdAt?.toMillis?.() || 0 
                };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error("Fetch site-testimonials error:", error);
        return [];
    }
}

export async function getSiteShopBanners() {
    try {
        const snapshot = await db.collection("shop_banners").orderBy("order", "asc").get();
        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Fetch site-shop-banners error:", error);
        return [];
    }
}
