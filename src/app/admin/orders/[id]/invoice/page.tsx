import { notFound } from "next/navigation";
import { getOrderById } from "../../actions";
import InvoiceView from "./InvoiceView";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrderInvoicePage({ params }: PageProps) {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) notFound();
    return <InvoiceView order={order} />;
}
