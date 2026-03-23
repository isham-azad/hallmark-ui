import { getShopBanners } from "../actions";
import ShopBannerClient from "./ShopBannerClient";

// Helper to safely serialize Firestore data for Client Components
function serializeItem(item: any) {
    if (!item) return item;
    const serialized = { ...item };
    if (serialized.createdAt && typeof serialized.createdAt.toDate === "function") {
        serialized.createdAt = serialized.createdAt.toDate().toISOString();
    } else if (serialized.createdAt && serialized.createdAt._seconds) {
        serialized.createdAt = new Date(serialized.createdAt._seconds * 1000).toISOString();
    }
    if (serialized.updatedAt && typeof serialized.updatedAt.toDate === "function") {
        serialized.updatedAt = serialized.updatedAt.toDate().toISOString();
    } else if (serialized.updatedAt && serialized.updatedAt._seconds) {
        serialized.updatedAt = new Date(serialized.updatedAt._seconds * 1000).toISOString();
    }
    return serialized;
}

export default async function ShopBannersPage() {
    const banners = await getShopBanners();
    const serializedBanners = banners.map(serializeItem);

    return <ShopBannerClient initialBanners={serializedBanners} />;
}
