import { Metadata } from "next";
import ShopClient from "./ShopClient";
import { getSiteProducts, getSiteCategories, getSiteShopBanners } from "@/lib/site-actions";
import { serializeData } from "@/lib/serialize";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: "Shop Online | HallMark Enterprises",
  description: "Browse our full range of trusted Hallmark products—quality essentials for every home, delivered to your door.",
  openGraph: {
    title: "Shop Online | HallMark Enterprises",
    description: "Browse our full range of trusted Hallmark products.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"],
  },
};

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
