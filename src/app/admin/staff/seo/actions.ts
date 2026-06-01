"use server";

import db from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";
import { FieldValue } from "firebase-admin/firestore";

export interface PageSeo {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
}

export interface SeoSettings {
    default: PageSeo;
    home: PageSeo;
    shop: PageSeo;
    b2b: PageSeo;
    cart: PageSeo;
    checkout: PageSeo;
    orderSuccess: PageSeo;
    b2bAccount: PageSeo;
    googleAnalyticsId: string;
    facebookPixelId: string;
    customHeadScript: string;
    customBodyScript: string;
    products?: Record<string, PageSeo>;
}

const DEFAULT_SEO: SeoSettings = {
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
    products: {},
};

async function verifyAuth(permission?: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    if (permission) {
        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(permission)) {
            throw new Error("Access Denied");
        }
    }
    return session;
}

export async function getSeoSettings(): Promise<SeoSettings> {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const doc = await db.collection("website_settings").doc("seo").get();
        if (doc.exists) {
            const data = doc.data();
            return {
                default: { ...DEFAULT_SEO.default, ...(data?.default || {}) },
                home: { ...DEFAULT_SEO.home, ...(data?.home || {}) },
                shop: { ...DEFAULT_SEO.shop, ...(data?.shop || {}) },
                b2b: { ...DEFAULT_SEO.b2b, ...(data?.b2b || {}) },
                cart: { ...DEFAULT_SEO.cart, ...(data?.cart || {}) },
                checkout: { ...DEFAULT_SEO.checkout, ...(data?.checkout || {}) },
                orderSuccess: { ...DEFAULT_SEO.orderSuccess, ...(data?.orderSuccess || {}) },
                b2bAccount: { ...DEFAULT_SEO.b2bAccount, ...(data?.b2bAccount || {}) },
                googleAnalyticsId: data?.googleAnalyticsId || "",
                facebookPixelId: data?.facebookPixelId || "",
                customHeadScript: data?.customHeadScript || "",
                customBodyScript: data?.customBodyScript || "",
                products: data?.products || {},
            };
        }
        return DEFAULT_SEO;
    } catch (error) {
        console.error("Failed to get SEO settings:", error);
        return DEFAULT_SEO;
    }
}

export async function updateSeoSettings(data: SeoSettings) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("website_settings").doc("seo").set({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await logAction(session.email, session.name, "UPDATE_SEO_SETTINGS", { updatedBy: session.email });
        
        revalidatePath("/");
        revalidatePath("/shop");
        revalidatePath("/b2b/login");
        revalidatePath("/b2b/account");
        revalidatePath("/cart");
        revalidatePath("/checkout");
        revalidatePath("/order-success");
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update SEO settings:", error);
        return { success: false, error: error.message };
    }
}
