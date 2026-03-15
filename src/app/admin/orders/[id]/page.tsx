"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getOrderById } from "../actions";
import OrderDetailClient from "./OrderDetailClient";
import { OrderDetailShimmer } from "./OrderDetailShimmer";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
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

    if (loading) return <OrderDetailShimmer />;
    if (!order) notFound();

    return <OrderDetailClient order={order} />;
}
