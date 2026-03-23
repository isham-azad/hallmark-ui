import { getHeroBanners } from "../actions";
import HeroBannerClient from "./HeroBannerClient";

export const dynamic = "force-dynamic";

function serializeItem(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    const out: any = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === "object" && "_seconds" in val) {
            out[key] = new Date(val._seconds * 1000).toISOString();
        } else if (val && typeof val.toDate === "function") {
            out[key] = val.toDate().toISOString();
        } else {
            out[key] = val;
        }
    }
    return out;
}

export default async function HeroBannerPage() {
    const banners = await getHeroBanners();
    const serialized = (banners as any[]).map(serializeItem);
    return <HeroBannerClient initialBanners={serialized} />;
}
