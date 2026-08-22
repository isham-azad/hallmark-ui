import { Metadata } from "next";
import { getSiteSeoSettings } from "@/lib/site-actions";
import { getB2BSession } from "@/lib/b2b-auth";
import { redirect } from "next/navigation";
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

export default async function B2BAccountPage() {
    const session = await getB2BSession();
    if (!session) {
        redirect("/b2b/login");
    }

    return <B2BAccountClient />;
}
