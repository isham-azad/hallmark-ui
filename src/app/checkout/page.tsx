import { Metadata } from "next";
import { getSiteSeoSettings } from "@/lib/site-actions";
import CheckoutClient from "./CheckoutClient";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSiteSeoSettings();
    const p = seo?.checkout;
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

export default function CheckoutPage() {
    return <CheckoutClient />;
}
