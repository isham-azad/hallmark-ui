import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "HallMark Enterprises | Wholesale Distributor & Food Processing Co.",
  description: "Authenticity in every essence. HallMark Enterprises is a leading wholesale distributor and food processing company committed to quality.",
  openGraph: {
    title: "HallMark Enterprises | Quality Food & Home Care",
    description: "Wholesale distributor and food processing company.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png"],
  },
};

export default function Page() {
  return <HomeClient />;
}
