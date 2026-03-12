import db from "@/lib/firebase";
import PricesClient from "./PricesClient";

export const dynamic = 'force-dynamic';

export default async function PricesPage() {
  const snapshot = await db.collection("products").orderBy("title", "asc").get();

  const products = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      sku: data.sku ?? null,
      price: data.price ?? null,
      wasPrice: data.wasPrice ?? null,
    };
  });

  return <PricesClient products={products} />;
}
