"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getOrderById } from "../../actions";
import InvoiceView from "./InvoiceView";
import { InvoiceShimmer } from "./InvoiceShimmer";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function OrderInvoicePage({ params }: PageProps) {
    const { id } = use(params);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            setLoading(true);
            const data = await getOrderById(id);
            setOrder(data);
            setLoading(false);
        }
        fetchOrder();
    }, [id]);

    if (loading) return <InvoiceShimmer />;
    if (!order) notFound();

    return <InvoiceView order={order} />;
}
