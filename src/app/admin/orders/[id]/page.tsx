import db from "@/lib/firebase";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";
import { getStaff } from "../../staff/actions";

interface PageProps {
    params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params;

    const [orderDoc, staff] = await Promise.all([
        db.collection("orders").doc(id).get(),
        getStaff()
    ]);

    if (!orderDoc.exists) notFound();

    const data = orderDoc.data()!;
    
    // Normalization helper
    const toISO = (val: any) => {
        if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
        if (val instanceof Date) return val.toISOString();
        if (typeof val === "string") return val;
        return new Date().toISOString();
    };

    const normalizePaymentMethod = (p: any): "COD" | "UPI" => {
        const s = String(p ?? "").toLowerCase();
        if (/cod|cash|cash\s*on\s*delivery|unpaid/.test(s)) return "COD";
        return "UPI";
    };

    const paymentMethod = (data.paymentMethod as string) || normalizePaymentMethod(data.payment);
    const paymentStatus = (data.paymentStatus as string) || "Pending";

    const order = {
        id: orderDoc.id,
        orderNo: data.orderNo as string,
        customer: data.customer as string,
        email: data.email as string,
        phone: (data.phone as string) ?? null,
        address: (data.address as string) ?? null,
        city: (data.city as string) ?? null,
        zip: (data.zip as string) ?? "",
        shippingName: (data.shippingName as string) ?? null,
        shippingAddress: (data.shippingAddress as string) ?? null,
        total: data.total as string,
        status: data.status as string,
        payment: data.payment as string,
        paymentMethod: paymentMethod === "COD" || paymentMethod === "UPI" ? paymentMethod : normalizePaymentMethod(data.payment),
        paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
        assignedTo: data.assignedTo ? {
            ...data.assignedTo,
            assignedAt: toISO(data.assignedTo.assignedAt)
        } : null,
        rewardsUsed: (data.rewardsUsed as number) || 0,
        rewardsEarned: (data.rewardsEarned as number) || 0,
        voucherAmount: (data.voucherAmount as number) || 0,
        date: toISO(data.date),
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        items: (data.items || []).map((item: any) => ({
            id: item.id as string,
            name: item.name as string,
            sku: (item.sku as string | null) ?? null,
            qty: item.qty as number,
            price: item.price as string,
            image: item.image as string | null,
            createdAt: toISO(item.createdAt),
        })),
    };

    return <OrderDetailClient order={order as any} availableStaff={staff} />;
}
