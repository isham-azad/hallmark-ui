import { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getSiteWebsiteContent, getSiteProducts, getSiteBrands, getSiteCategories, getSiteTestimonials, getSiteSeoSettings } from "@/lib/site-actions";
import { serializeData } from "@/lib/serialize";

export const revalidate = 3600; // Cache for 1 hour, auto-regenerate in background

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  const pageSeo = seo?.home || seo?.default;
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
  const [websiteContent, products, brands, categories, testimonials] = await Promise.all([
    getSiteWebsiteContent(),
    getSiteProducts(10),
    getSiteBrands(),
    getSiteCategories(),
    getSiteTestimonials(),
  ]);

  return (
    <HomeClient
      initialData={serializeData({
        websiteContent,
        products,
        brands,
        categories,
        testimonials
      })}
    />
  );
}
