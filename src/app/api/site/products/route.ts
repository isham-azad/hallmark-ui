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
                    b2bPricingTiers: data.b2bPricingTiers || [],
                    isReturnable: data.isReturnable as boolean | undefined,
                    isDeliveredByHallmark: data.isDeliveredByHallmark as boolean | undefined,
                    isFreeDelivery: data.isFreeDelivery as boolean | undefined,
                    isSecureTransaction: data.isSecureTransaction as boolean | undefined,
                    itemWeight: data.itemWeight as string | undefined,
                    itemDimensions: data.itemDimensions as string | undefined,
                    scent: data.scent as string | undefined,
                    skinType: data.skinType as string | undefined,
                    itemPackageQuantity: data.itemPackageQuantity as string | undefined,
                    productBenefits: data.productBenefits as string | undefined,
                    specialFeature: data.specialFeature as string | undefined,
                    itemForm: data.itemForm as string | undefined,
                    numberOfItems: data.numberOfItems as string | undefined,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Site products API error:", error);
        return NextResponse.json({ products: [] });
    }
}
