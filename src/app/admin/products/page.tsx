import db from "@/lib/firebase";
import ProductsClient from "./ProductsClient";

export const dynamic = 'force-dynamic';

type ProductsListProps = {
  searchParams: Promise<{ brandId?: string; categoryId?: string }>;
};

export default async function ProductsList({ searchParams }: ProductsListProps) {
  const params = await searchParams;
  const snapshot = await db.collection("products").orderBy("updatedAt", "desc").get();

  const categoryIds = [...new Set(snapshot.docs.map(d => d.data().categoryId).filter(Boolean))];
  const categoriesMap: Record<string, string> = {};
  if (categoryIds.length > 0) {
    const catDocs = await Promise.all(categoryIds.map(cid => db.collection("categories").doc(cid).get()));
    catDocs.forEach(cd => {
      if (cd.exists) categoriesMap[cd.id] = cd.data()!.name;
    });
  }

  const products = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      status: data.status === "disabled" ? "disabled" : "active",
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      category: { name: categoriesMap[data.categoryId] || "Unknown" },
    };
  });

  return (
    <ProductsClient
      initialProducts={products as any[]}
      initialBrandId={params.brandId}
      initialCategoryId={params.categoryId}
    />
  );
}
