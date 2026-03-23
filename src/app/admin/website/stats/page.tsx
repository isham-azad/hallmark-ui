import { getStatsSection } from "../actions";
import StatsSectionClient from "./StatsSectionClient";

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

export default async function StatsSectionPage() {
    const stats = await getStatsSection();
    return (
        <StatsSectionClient 
            initialData={stats ? serialize(stats) : null} 
            liveCounts={stats.liveCounts}
        />
    );
}
