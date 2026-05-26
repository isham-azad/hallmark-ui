import B2BLoginClient from "./B2BLoginClient";
import { Metadata } from "next";
import { getSiteSeoSettings } from "@/lib/site-actions";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSiteSeoSettings();
    const pageSeo = seo?.b2b || seo?.default;
    return {
        title: pageSeo?.title,
        description: pageSeo?.description,
        keywords: pageSeo?.keywords,
        openGraph: {
            title: pageSeo?.ogTitle || pageSeo?.title,
            description: pageSeo?.ogDescription || pageSeo?.description,
            images: pageSeo?.ogImage ? [pageSeo.ogImage] : [],
        },
    };
}


export default function B2BLoginPage() {
    return <B2BLoginClient />;
}
