import { Metadata } from "next";
import ShopClient from "./ShopClient";
import { getSiteProducts, getSiteCategories, getSiteShopBanners, getSiteSeoSettings } from "@/lib/site-actions";
import { serializeData } from "@/lib/serialize";


export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  const pageSeo = seo?.shop || seo?.default;
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


export default async function Page() {
  const [products, categories, banners] = await Promise.all([
    getSiteProducts(),
    getSiteCategories(),
    getSiteShopBanners(),
  ]);

  return (
    <ShopClient 
      initialData={serializeData({
        products,
        categories,
        banners
      })} 
    />
  );
}
