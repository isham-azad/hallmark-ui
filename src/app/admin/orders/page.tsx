import db from "@/lib/firebase";
import OrdersClient from "./OrdersClient";
import { getStaff } from "../staff/actions";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [snapshot, staff] = await Promise.all([
    db.collection("orders").orderBy("createdAt", "desc").get(),
    getStaff()
  ]);

  const normalizePaymentMethod = (p: unknown): "COD" | "UPI" => {
    const s = String(p ?? "").toLowerCase();
    if (/cod|cash|cash\s*on\s*delivery|unpaid/.test(s)) return "COD";
    return "UPI";
  };

  const orders = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const toISO = (val: unknown) => {
      if (val && typeof val === "object" && "toDate" in val) return (val as { toDate: () => Date }).toDate().toISOString();
      if (val instanceof Date) return val.toISOString();
      return new Date().toISOString();
    };
    const paymentMethod = (data.paymentMethod as string) || normalizePaymentMethod(data.payment);
    const paymentStatus = (data.paymentStatus as string) || "Pending";
    return {
      id: doc.id,
      orderNo: data.orderNo as string,
      customer: data.customer as string,
      email: data.email as string,
      phone: (data.phone as string) ?? null,
      pincode: (data.zip as string) ?? "",
      total: data.total as string,
      status: data.status as string,
      payment: data.payment as string,
      paymentMethod: paymentMethod === "COD" || paymentMethod === "UPI" ? paymentMethod : normalizePaymentMethod(data.payment),
      paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
      assignedTo: data.assignedTo 
        ? { ...data.assignedTo, assignedAt: toISO(data.assignedTo.assignedAt) } 
        : null,
      date: toISO(data.date),
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
      items: (data.items || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        sku: (item.sku as string | null) ?? null,
        qty: item.qty as number,
        price: item.price as string,
        createdAt: toISO(item.createdAt),
      })),
    };
  });

  return <OrdersClient initialOrders={orders as any} availableStaff={staff} />;
}
