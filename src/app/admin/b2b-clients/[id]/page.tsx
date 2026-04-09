import { getB2BClientDetail } from "../actions";
import ClientDetailView from "./ClientDetailView";
import { notFound } from "next/navigation";

export default async function B2BClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const data = await getB2BClientDetail(resolvedParams.id);

    if (!data) {
        notFound();
    }

    return <ClientDetailView data={data} />;
}
