import db from "@/lib/firebase";
import ProductAddClient from "./ProductAddClient";

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const [brandsSnap, categoriesSnap] = await Promise.all([
    db.collection("brands").orderBy("name", "asc").get(),
    db.collection("categories").orderBy("name", "asc").get(),
  ]);

  const brands = brandsSnap.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name }));
  const categories = categoriesSnap.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name }));

  return <ProductAddClient brands={brands} categories={categories} />;
}
