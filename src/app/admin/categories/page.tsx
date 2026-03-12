import db from "@/lib/firebase";
import CategoriesClient from "./CategoriesClient";

export const dynamic = 'force-dynamic';

export default async function CategoriesManagement() {
  const [categoriesSnap, productsSnap] = await Promise.all([
    db.collection("categories").get(),
    db.collection("products").select("categoryId").get(),
  ]);

  const productCountByCategory: Record<string, number> = {};
  productsSnap.docs.forEach((doc: any) => {
    const categoryId = doc.data().categoryId;
    if (categoryId) {
      productCountByCategory[categoryId] = (productCountByCategory[categoryId] || 0) + 1;
    }
  });

  const categories = categoriesSnap.docs
    .map((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toMillis?.() ?? 0;
      return {
        id: doc.id,
        name: data.name as string,
        summary: data.summary as string,
        image: (data.image as string | null) ?? null,
        status: (data.status === "disabled" ? "disabled" : "active") as "active" | "disabled",
        _count: { products: productCountByCategory[doc.id] || 0 },
        _createdAt: createdAt,
      };
    })
    .sort((a: any, b: any) => b._createdAt - a._createdAt)
    .map(({ _createdAt, ...rest }: any) => rest);

  return <CategoriesClient initialCategories={categories} />;
}
