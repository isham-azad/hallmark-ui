import db from "@/lib/firebase";
import BrandsClient from "./BrandsClient";

export const dynamic = 'force-dynamic';

export default async function BrandsManagement() {
  const [brandsSnap, productsSnap] = await Promise.all([
    db.collection("brands").get(),
    db.collection("products").select("brandId").get(),
  ]);

  const productCountByBrand: Record<string, number> = {};
  productsSnap.docs.forEach(doc => {
    const brandId = doc.data().brandId;
    if (brandId) {
      productCountByBrand[brandId] = (productCountByBrand[brandId] || 0) + 1;
    }
  });

  const brands = brandsSnap.docs
    .map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toMillis?.() ?? 0;
      return {
        id: doc.id,
        name: data.name as string,
        summary: data.summary as string,
        image: (data.image as string | null) ?? null,
        status: (data.status === "disabled" ? "disabled" : "active") as "active" | "disabled",
        _count: { products: productCountByBrand[doc.id] || 0 },
        _createdAt: createdAt,
      };
    })
    .sort((a, b) => b._createdAt - a._createdAt)
    .map(({ _createdAt, ...rest }) => rest);

  return <BrandsClient initialBrands={brands} />;
}
