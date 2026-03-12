import { notFound } from "next/navigation";
import { getOrderById } from "../actions";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) notFound();
    return <OrderDetailClient order={order} />;
}
