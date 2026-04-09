"use server";

import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

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

// Hero Banners
export async function getHeroBanners() {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const snapshot = await db.collection("hero_banners").orderBy("order", "asc").get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
        console.error("Failed to get hero banners:", error);
        return [];
    }
}

export async function addHeroBanner(image: string, order: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const docRef = await db.collection("hero_banners").add({
            image,
            order: order || 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "ADD_HERO_BANNER", { docId: docRef.id });
        revalidatePath("/");
        revalidatePath("/admin/website/hero");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to add hero banner:", error);
        return { success: false, error: error.message };
    }
}

export async function updateHeroBanner(id: string, image: string, order: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("hero_banners").doc(id).update({
            image,
            order,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_HERO_BANNER", { id });
        revalidatePath("/");
        revalidatePath("/admin/website/hero");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update hero banner:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteHeroBanner(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("hero_banners").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_HERO_BANNER", { id });
        revalidatePath("/");
        revalidatePath("/admin/website/hero");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete hero banner:", error);
        return { success: false, error: error.message };
    }
}

// About Us
export async function getAboutUs() {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const doc = await db.collection("website_settings").doc("about_us").get();
        return doc.exists ? doc.data() : null;
    } catch (error: any) {
        console.error("Failed to get about us:", error);
        return null;
    }
}

export async function updateAboutUs(data: {
    title: string;
    description1: string;
    description2: string;
    description3: string;
    points: string[];
    image?: string;
    cards?: { icon: string; title: string; desc: string }[];
}) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("website_settings").doc("about_us").set({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await logAction(session.email, session.name, "UPDATE_ABOUT_US", data);
        revalidatePath("/");
        revalidatePath("/admin/website/about");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update about us:", error);
        return { success: false, error: error.message };
    }
}

export async function getStatsSection() {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const doc = await db.collection("website_settings").doc("stats").get();
        const statsData = doc.exists ? doc.data() : null;

        const [productsSnap, categoriesSnap] = await Promise.all([
            db.collection("products").get(),
            db.collection("categories").get(),
        ]);
 
        return {
            ...statsData,
            liveCounts: {
                products: productsSnap.size,
                categories: categoriesSnap.size,
            }
        };
    } catch (error: any) {
        console.error("Failed to get stats section:", error);
        return null;
    }
}

export async function updateStatsSection(data: {
    title: string;
    description: string;
    image: string;
    stats: { icon: string; value: string; label: string }[];
}) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("website_settings").doc("stats").set({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await logAction(session.email, session.name, "UPDATE_STATS_SECTION", data);
        revalidatePath("/");
        revalidatePath("/admin/website/stats");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update stats section:", error);
        return { success: false, error: error.message };
    }
}

// Shop Banners
export async function getShopBanners() {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const snapshot = await db.collection("shop_banners").orderBy("order", "asc").get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
        console.error("Failed to get shop banners:", error);
        return [];
    }
}

export async function addShopBanner(image: string, order: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const docRef = await db.collection("shop_banners").add({
            image,
            order: order || 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "ADD_SHOP_BANNER", { docId: docRef.id });
        revalidatePath("/shop");
        revalidatePath("/admin/website/shop-banners");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to add shop banner:", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopBanner(id: string, image: string, order: number) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("shop_banners").doc(id).update({
            image,
            order,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await logAction(session.email, session.name, "UPDATE_SHOP_BANNER", { id });
        revalidatePath("/shop");
        revalidatePath("/admin/website/shop-banners");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update shop banner:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteShopBanner(id: string) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("shop_banners").doc(id).delete();

        await logAction(session.email, session.name, "DELETE_SHOP_BANNER", { id });
        revalidatePath("/shop");
        revalidatePath("/admin/website/shop-banners");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete shop banner:", error);
        return { success: false, error: error.message };
    }
}

// Investors Section
export async function getInvestorsSection() {
    try {
        await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        const doc = await db.collection("website_settings").doc("investors").get();
        return doc.exists ? doc.data() : null;
    } catch (error: any) {
        console.error("Failed to get investors section:", error);
        return null;
    }
}

export async function updateInvestorsSection(data: {
    badgeText: string;
    titleLight: string;
    titleBold: string;
    description: string;
    cards: { icon: string; title: string; description: string }[];
    bottomText: string;
}) {
    try {
        const session = await verifyAuth(PERMISSIONS.MANAGE_WEBSITE);
        await db.collection("website_settings").doc("investors").set({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await logAction(session.email, session.name, "UPDATE_INVESTORS_SECTION", data);
        revalidatePath("/");
        revalidatePath("/admin/website/investors");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update investors section:", error);
        return { success: false, error: error.message };
    }
}
