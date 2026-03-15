import { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop Online | HallMark Enterprises",
  description: "Browse our full range of trusted Hallmark products—quality essentials for every home, delivered to your door.",
  openGraph: {
    title: "Shop Online | HallMark Enterprises",
    description: "Browse our full range of trusted Hallmark products.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"],
  },
};

export default function Page() {
  return <ShopClient />;
}
