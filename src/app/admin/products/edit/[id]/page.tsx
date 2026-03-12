import db from "@/lib/firebase";
import ProductEditClient from "../ProductEditClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
        notFound();
    }

    const data = doc.data()!;
    const product = {
        id: doc.id,
        title: data.title as string,
        desc: data.desc as string,
        image: (data.image as string | null) ?? null,
        price: (data.price as string | null) ?? null,
        wasPrice: (data.wasPrice as string | null) ?? null,
        sku: (data.sku as string | null) ?? null,
        stock: (data.stock as number) ?? 0,
        brandId: data.brandId as string,
        categoryId: data.categoryId as string,
    };

    const [brandsSnap, categoriesSnap] = await Promise.all([
        db.collection("brands").orderBy("name", "asc").get(),
        db.collection("categories").orderBy("name", "asc").get(),
    ]);

    const brands = brandsSnap.docs.map((d: any) => ({ id: d.id, name: d.data().name }));
    const categories = categoriesSnap.docs.map((d: any) => ({ id: d.id, name: d.data().name }));

    return <ProductEditClient product={product} brands={brands} categories={categories} />;
}
