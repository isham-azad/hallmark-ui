"use server";
import db from "@/lib/firebase";

import { SiteProduct, SiteBrand, SiteCategory, SiteTestimonial } from "@/lib/types";

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

export async function getSiteProducts(limitCount?: number): Promise<SiteProduct[]> {
    try {
        let query = db.collection("products").orderBy("updatedAt", "desc");
        
        if (limitCount) {
            query = query.limit(limitCount);
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
            .filter((p: SiteProduct | null): p is SiteProduct => p !== null)
            // Sort by updatedAt descending in memory
            .sort((a: SiteProduct, b: SiteProduct) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (error) {
        console.error("Fetch site-products error:", error);
        return [];
    }
}

export async function getSiteBrands(): Promise<SiteBrand[]> {
    try {
        const snapshot = await db.collection("brands").get();
        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return { id: doc.id, name: data.name, shortDesc: data.shortDesc || "", summary: data.summary || "", image: data.image || "" } as SiteBrand;
            })
            .filter((b: SiteBrand | null): b is SiteBrand => b !== null);
    } catch (error) {
        console.error("Fetch site-brands error:", error);
        return [];
    }
}

export async function getSiteCategories(): Promise<SiteCategory[]> {
    try {
        const snapshot = await db.collection("categories").get();
        return snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return { id: doc.id, name: data.name, summary: data.summary || "", image: data.image || "" } as SiteCategory;
            })
            .filter((c: SiteCategory | null): c is SiteCategory => c !== null);
    } catch (error) {
        console.error("Fetch site-categories error:", error);
        return [];
    }
}

export async function getSiteTestimonials(): Promise<SiteTestimonial[]> {
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
                } as SiteTestimonial;
            })
            .filter((t: SiteTestimonial | null): t is SiteTestimonial => t !== null)
            .sort((a: SiteTestimonial, b: SiteTestimonial) => b.createdAt - a.createdAt);
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

const DEFAULT_SEO = {
    default: {
        title: "HallMark Enterprises",
        description: "A Wholesale Distributor & Food Processing Co.",
        keywords: "wholesale, distributor, food processing, hallmark",
        ogTitle: "HallMark Enterprises",
        ogDescription: "A Wholesale Distributor & Food Processing Co.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    home: {
        title: "HallMark Enterprises | Wholesale Distributor & Food Processing Co.",
        description: "Authenticity in every essence. HallMark Enterprises is a leading wholesale distributor and food processing company committed to quality.",
        keywords: "wholesale, distributor, food processing, hallmark, premium food",
        ogTitle: "HallMark Enterprises | Quality Food & Home Care",
        ogDescription: "Wholesale distributor and food processing company.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    shop: {
        title: "Shop Premium Products | HallMark Enterprises",
        description: "Browse and order premium food staples, spices, dry fruits, and household essentials online from HallMark Enterprises.",
        keywords: "online grocery shop, hallmark shop, wholesale staples, spices online",
        ogTitle: "Shop Online | HallMark Enterprises",
        ogDescription: "Browse and order our range of food staples, household items and spices.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    b2b: {
        title: "B2B Client Portal | HallMark Enterprises",
        description: "Access the HallMark Enterprises B2B distributor portal. Manage orders, track shipments, and view wholesale catalog.",
        keywords: "B2B login, distributor portal, wholesale business login, hallmark b2b",
        ogTitle: "B2B Partner Portal | HallMark Enterprises",
        ogDescription: "Log in to manage your wholesale orders and account details.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    cart: {
        title: "Your Shopping Cart | HallMark Enterprises",
        description: "Review your items and proceed to secure checkout.",
        keywords: "shopping cart, cart, hallmark cart, b2b cart",
        ogTitle: "Your Shopping Cart | HallMark Enterprises",
        ogDescription: "Review your items before checkout.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    checkout: {
        title: "Secure Checkout | HallMark Enterprises",
        description: "Provide your billing and delivery information to complete your order.",
        keywords: "checkout, secure checkout, hallmark checkout",
        ogTitle: "Secure Checkout | HallMark Enterprises",
        ogDescription: "Provide information to complete your order.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    orderSuccess: {
        title: "Order Placed Successfully | HallMark Enterprises",
        description: "Thank you for your order! Your purchase was successful.",
        keywords: "order success, order confirmation, hallmark order",
        ogTitle: "Order Placed Successfully | HallMark Enterprises",
        ogDescription: "Thank you for your purchase!",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    b2bAccount: {
        title: "My Account | B2B Distributor Portal",
        description: "Manage your business account, view recent orders, and update details.",
        keywords: "b2b account, account details, hallmark distributor portal",
        ogTitle: "My B2B Account | HallMark Enterprises",
        ogDescription: "Manage your business account and orders.",
        ogImage: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png",
    },
    googleAnalyticsId: "",
    facebookPixelId: "",
    customHeadScript: "",
    customBodyScript: "",
};

export async function getSiteSeoSettings() {
    try {
        const doc = await db.collection("website_settings").doc("seo").get();
        if (doc.exists) {
            const data = doc.data() || {};
            return {
                default: { ...DEFAULT_SEO.default, ...(data.default || {}) },
                home: { ...DEFAULT_SEO.home, ...(data.home || {}) },
                shop: { ...DEFAULT_SEO.shop, ...(data.shop || {}) },
                b2b: { ...DEFAULT_SEO.b2b, ...(data.b2b || {}) },
                cart: { ...DEFAULT_SEO.cart, ...(data.cart || {}) },
                checkout: { ...DEFAULT_SEO.checkout, ...(data.checkout || {}) },
                orderSuccess: { ...DEFAULT_SEO.orderSuccess, ...(data.orderSuccess || {}) },
                b2bAccount: { ...DEFAULT_SEO.b2bAccount, ...(data.b2bAccount || {}) },
                googleAnalyticsId: data.googleAnalyticsId || "",
                facebookPixelId: data.facebookPixelId || "",
                customHeadScript: data.customHeadScript || "",
                customBodyScript: data.customBodyScript || "",
            };
        }
    } catch (error) {
        console.error("Fetch site-seo-settings error:", error);
    }
    return DEFAULT_SEO;
}

