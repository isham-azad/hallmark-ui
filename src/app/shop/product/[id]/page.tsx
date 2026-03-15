import { Metadata, ResolvingMetadata } from "next";
import db from "@/lib/firebase";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const doc = await db.collection("products").doc(id).get();
    
    if (!doc.exists) {
      return {
        title: "Product Not Found | HallMark Enterprises",
      };
    }

    const data = doc.data();
    const title = data?.title || "Product Details";
    const description = data?.desc || "A Wholesale Distributor & Food Processing Co.";
    const imageRaw = data?.image as string | null;
    const images = imageRaw ? imageRaw.split(',').filter(Boolean) : [];
    const mainImage = images[0] || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png";

    return {
      title: `${title} | HallMark Enterprises`,
      description: description.slice(0, 160),
      openGraph: {
        title: `${title} | HallMark Enterprises`,
        description: description.slice(0, 160),
        images: [
          {
            url: mainImage,
            width: 800,
            height: 600,
            alt: title,
          },
        ],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | HallMark Enterprises`,
        description: description.slice(0, 160),
        images: [mainImage],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: "Product Details | HallMark Enterprises",
    };
  }
}

export default function Page() {
  return <ProductDetailClient />;
}
