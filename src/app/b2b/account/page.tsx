import { Metadata } from "next";
import { getSiteSeoSettings } from "@/lib/site-actions";
import B2BAccountClient from "./B2BAccountClient";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSiteSeoSettings();
    const p = seo?.b2bAccount;
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

export default function B2BAccountPage() {
    return <B2BAccountClient />;
}
