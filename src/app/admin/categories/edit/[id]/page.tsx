import db from "@/lib/firebase";
import CategoryEditClient from "./CategoryEditClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const doc = await db.collection("categories").doc(id).get();

    if (!doc.exists) {
        notFound();
    }

    const data = doc.data()!;
    const category = {
        id: doc.id,
        name: data.name as string,
        summary: data.summary as string,
        image: (data.image as string | null) ?? null,
    };

    return <CategoryEditClient category={category} />;
}
