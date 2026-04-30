import db from "@/lib/firebase";
import BrandEditClient from "./BrandEditClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditBrandPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const doc = await db.collection("brands").doc(id).get();

    if (!doc.exists) {
        notFound();
    }

    const data = doc.data()!;
    const brand = { id: doc.id, name: data.name as string, shortDesc: (data.shortDesc as string) ?? "", summary: data.summary as string, image: (data.image as string | null) ?? null, banner: (data.banner as string | null) ?? null };

    return <BrandEditClient brand={brand} />;
}
