import { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSeoSettings } from "@/lib/site-actions";
import OrderSuccessClient from "./OrderSuccessClient";

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getSiteSeoSettings();
    const p = seo?.orderSuccess;
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

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="container py-5 text-center">Loading order details...</div>}>
            <OrderSuccessClient />
        </Suspense>
    );
}
