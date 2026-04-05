import { Metadata } from "next";
import HomeClient from "./HomeClient";
import Image from "next/image";
import { getSiteWebsiteContent, getSiteProducts, getSiteBrands, getSiteCategories, getSiteTestimonials } from "@/lib/site-actions";
import { serializeData } from "@/lib/serialize";

export const revalidate = 3600; // Cache for 1 hour, auto-regenerate in background

export const metadata: Metadata = {
  title: "HallMark Enterprises | Wholesale Distributor & Food Processing Co.",
  description: "Authenticity in every essence. HallMark Enterprises is a leading wholesale distributor and food processing company committed to quality.",
  openGraph: {
    title: "HallMark Enterprises | Quality Food & Home Care",
    description: "Wholesale distributor and food processing company.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png"],
  },
};

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
