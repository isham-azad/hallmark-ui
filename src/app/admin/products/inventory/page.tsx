import db from "@/lib/firebase";
import InventoryClient from "./InventoryClient";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const snapshot = await db.collection("products").orderBy("title", "asc").get();

  const products = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      image: data.image ?? null,
      sku: data.sku ?? null,
      stock: data.stock ?? 0,
    };
  });

  return <InventoryClient products={products} />;
}
