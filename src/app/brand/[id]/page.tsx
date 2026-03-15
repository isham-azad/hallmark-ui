import { Metadata, ResolvingMetadata } from "next";
import db from "@/lib/firebase";
import BrandClient from "./BrandClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const doc = await db.collection("brands").doc(id).get();
    
    if (!doc.exists) {
      return {
        title: "Brand Not Found | HallMark Enterprises",
      };
    }

    const data = doc.data();
    const name = data?.name || "Brand";
    const summary = data?.summary || "Quality products from HallMark Enterprises.";
    const image = data?.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png";

    return {
      title: `${name} | HallMark Enterprises`,
      description: summary.slice(0, 160),
      openGraph: {
        title: `${name} | HallMark Enterprises`,
        description: summary.slice(0, 160),
        images: [
          {
            url: image,
            width: 800,
            height: 600,
            alt: name,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | HallMark Enterprises`,
        description: summary.slice(0, 160),
        images: [image],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: "Our Brands | HallMark Enterprises",
    };
  }
}

export default function Page() {
  return <BrandClient />;
}
