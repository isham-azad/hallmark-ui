import { getCustomerDetail } from "../actions";
import CustomerDetailView from "./CustomerDetailView";
import { notFound } from "next/navigation";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const data = await getCustomerDetail(resolvedParams.id);

    if (!data) {
        notFound();
    }

    return <CustomerDetailView data={data} />;
}
