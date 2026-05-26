import { Metadata } from "next";
import { getSiteSeoSettings } from "@/lib/site-actions";
import PortfolioDetailsClient from "./PortfolioDetailsClient";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSiteSeoSettings();
    const p = seo?.portfolioDetails;
    return {
        title: p?.title,
        description: p?.description,
        keywords: p?.keywords,
        openGraph: {
            title: p?.ogTitle,
            description: p?.ogDescription,
            images: p?.ogImage ? [p.ogImage] : [],
        },
    };
}

export default function Page() {
    return <PortfolioDetailsClient />;
}
