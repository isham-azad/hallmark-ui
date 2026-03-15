import { Metadata } from "next";
import PortfolioDetailsClient from "./PortfolioDetailsClient";

export const metadata: Metadata = {
  title: "Portfolio Details | HallMark Enterprises",
  description: "A detailed look at our successful projects and processing facilities.",
  openGraph: {
    title: "Portfolio Details | HallMark Enterprises",
    description: "Successful projects and processing facilities.",
    images: ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566386/hallmark/assets/img/portfolio/app-1.jpg"],
  },
};

export default function Page() {
  return <PortfolioDetailsClient />;
}
