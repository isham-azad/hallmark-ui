import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("products").orderBy("updatedAt", "desc").get();
        const categoryIds = [...new Set(snapshot.docs.map((d: any) => d.data().categoryId).filter(Boolean))];
        const brandIds = [...new Set(snapshot.docs.map((d: any) => d.data().brandId).filter(Boolean))];

        const [catSnap, brandSnap] = await Promise.all([
            categoryIds.length ? db.collection("categories").get() : Promise.resolve({ docs: [] }),
            brandIds.length ? db.collection("brands").get() : Promise.resolve({ docs: [] }),
        ]);

        const categoryNames: Record<string, string> = {};
        catSnap.docs.forEach((d: any) => {
            categoryNames[d.id] = d.data().name as string;
        });
        const brandNames: Record<string, string> = {};
        brandSnap.docs.forEach((d: any) => {
            brandNames[d.id] = d.data().name as string;
        });

        const products = snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                const imageRaw = data.image as string | null;
                return {
                    id: doc.id,
                    title: data.title as string,
                    desc: (data.desc as string) ?? "",
                    image: imageRaw || undefined,
                    price: (data.price as string) ?? undefined,
                    wasPrice: (data.wasPrice as string) ?? undefined,
                    category: data.categoryId as string,
                    brand: data.brandId as string,
                    categoryName: categoryNames[data.categoryId as string],
                    brandName: brandNames[data.brandId as string],
                    howToUse: (data.howToUse as string) ?? "",
                    sku: (data.sku as string) ?? "",
                };
            })
            .filter(Boolean);

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Site products API error:", error);
        return NextResponse.json({ products: [] });
    }
}
