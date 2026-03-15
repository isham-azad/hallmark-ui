import { Metadata } from "next";
import ProductDetailsStaticClient from "./ProductDetailsStaticClient";

export const metadata: Metadata = {
  title: "Soph Dishwash Liquid | HallMark Enterprises",
  description: "Powerful grease-cutting action with refreshing fragrances including Lime, Orange, and Green Apple.",
  openGraph: {
    title: "Soph Dishwash Liquid | HallMark Enterprises",
    description: "Powerful grease-cutting and stain removal.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"],
  },
};

export default function Page() {
  return <ProductDetailsStaticClient />;
}
