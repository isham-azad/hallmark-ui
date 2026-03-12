import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [productsSnap, brandsSnap, categoriesSnap, ordersSnap, recentProductsSnap, recentOrdersSnap] = await Promise.all([
      db.collection("products").count().get(),
      db.collection("brands").count().get(),
      db.collection("categories").count().get(),
      db.collection("orders").count().get(),
      db.collection("products").orderBy("createdAt", "desc").limit(5).get(),
      db.collection("orders").orderBy("createdAt", "desc").limit(5).get(),
    ]);

    const productCount = productsSnap.data().count;
    const brandCount = brandsSnap.data().count;
    const categoryCount = categoriesSnap.data().count;
    const orderCount = ordersSnap.data().count;

    const ordersForRevenue = await db.collection("orders").select("total").get();
    const totalRevenue = ordersForRevenue.docs.reduce((acc: number, doc) => {
      const val = parseFloat(String(doc.data().total).replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 0);

    const stats = [
      { label: "Total Products", value: productCount.toString(), icon: "bi bi-box-seam", color: "#38bdf8" },
      { label: "Total Orders", value: orderCount.toString(), icon: "bi bi-cart-check", color: "#6366f1" },
      { label: "Brands", value: brandCount.toString(), icon: "bi bi-building", color: "#f59e0b" },
      { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: "bi bi-currency-rupee", color: "#10b981" },
    ];

    const brandIds = [...new Set(recentProductsSnap.docs.map(d => d.data().brandId).filter(Boolean))];
    const brandsMap: Record<string, string> = {};
    if (brandIds.length > 0) {
      const brandDocs = await Promise.all(brandIds.map(bid => db.collection("brands").doc(bid).get()));
      brandDocs.forEach(bd => {
        if (bd.exists) brandsMap[bd.id] = bd.data()!.name;
      });
    }

    const recentProducts = recentProductsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        brand: { id: data.brandId, name: brandsMap[data.brandId] || "Unknown" },
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });

    const toISO = (val: unknown): string => {
      if (val && typeof val === "object" && "toDate" in val) return (val as { toDate: () => Date }).toDate().toISOString();
      if (val instanceof Date) return val.toISOString();
      return new Date().toISOString();
    };

    const normalizePaymentMethod = (p: unknown): "COD" | "UPI" => {
      const s = String(p ?? "").toLowerCase();
      if (/cod|cash|cash\s*on\s*delivery|unpaid/.test(s)) return "COD";
      return "UPI";
    };

    const recentOrders = recentOrdersSnap.docs.map(doc => {
      const data = doc.data();
      const paymentMethod = (data.paymentMethod as string) || normalizePaymentMethod(data.payment);
      const paymentStatus = (data.paymentStatus as string) || "Pending";
      return {
        id: doc.id,
        orderNo: (data.orderNo as string) || doc.id.slice(0, 8).toUpperCase(),
        customer: (data.customer as string) || "Unknown",
        total: (data.total as string) || "₹0",
        status: (data.status as string) || "Pending",
        paymentMethod: paymentMethod === "COD" || paymentMethod === "UPI" ? paymentMethod : normalizePaymentMethod(data.payment),
        paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
        createdAt: toISO(data.createdAt),
      };
    });

    const systemStatus = {
      database: "Healthy & Connected",
      color: "#16a34a",
      bg: "#bbf7d0",
      badge: "#f0fdf4",
      icon: "bi bi-database-check"
    };

    return NextResponse.json({
      stats,
      recentProducts,
      recentOrders,
      systemStatus
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      stats: [],
      recentProducts: [],
      recentOrders: [],
      systemStatus: {
        database: "Connection Error",
        color: "#dc2626",
        bg: "#fecaca",
        badge: "#fef2f2",
        icon: "bi bi-database-exclamation"
      }
    }, { status: 500 });
  }
}
