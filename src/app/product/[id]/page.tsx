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

    // Setup base fallback metadata
    let seoTitle = `${title} | HallMark Enterprises`;
    let seoDesc = description.slice(0, 160);
    let seoKeywords = "wholesale, distributor, food processing, hallmark";
    let seoOgTitle = seoTitle;
    let seoOgDesc = seoDesc;
    let seoOgImage = mainImage;

    // Apply custom product-specific SEO overrides if they exist
    try {
      const seoDoc = await db.collection("website_settings").doc("seo").get();
      if (seoDoc.exists) {
        const seoData = seoDoc.data();
        const pSeo = seoData?.products?.[id];
        if (pSeo) {
          if (pSeo.title) seoTitle = pSeo.title;
          if (pSeo.description) seoDesc = pSeo.description;
          if (pSeo.keywords) seoKeywords = pSeo.keywords;
          seoOgTitle = pSeo.ogTitle || seoTitle;
          seoOgDesc = pSeo.ogDescription || seoDesc;
          if (pSeo.ogImage) seoOgImage = pSeo.ogImage;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch product SEO overrides:", e);
    }

    return {
      title: seoTitle,
      description: seoDesc,
      keywords: seoKeywords,
      openGraph: {
        title: seoOgTitle,
        description: seoOgDesc,
        images: [
          {
            url: seoOgImage,
            width: 800,
            height: 600,
            alt: title,
          },
        ],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: seoOgTitle,
        description: seoOgDesc,
        images: [seoOgImage],
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
