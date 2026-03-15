import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

async function getHandler() {
  const toISO = (val: unknown): string => {
    if (val && typeof val === "object" && "toDate" in val)
      return (val as { toDate: () => Date }).toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "string") return val;
    return new Date().toISOString();
  };

  // 1. Checkout OTPs — phoneVerifications (doc ID = phone number)
  const checkoutSnap = await db.collection("phoneVerifications").get();
  const checkoutOtps = checkoutSnap.docs.map((doc: any) => ({
    id: doc.id,
    mobile: doc.id,
    otp: (doc.data().otp as string) || "—",
    source: "Checkout",
    label: null,
    expiry: toISO(doc.data().otpExpiry),
    updatedAt: toISO(doc.data().updatedAt),
  }));

  // 2. Admin Login OTPs — admins collection, only those with an active otp
  const adminsSnap = await db.collection("admins").where("otp", "!=", null).get();
  const adminOtps = adminsSnap.docs
    .filter((doc: any) => doc.data().otp)
    .map((doc: any) => ({
      id: doc.id,
      mobile: (doc.data().phone as string) || "—",
      otp: (doc.data().otp as string) || "—",
      source: "Admin Login",
      label: (doc.data().email as string) || null,
      expiry: toISO(doc.data().otpExpiry),
      updatedAt: toISO(doc.data().otpExpiry ?? new Date()),
    }));

  // 3. Delivery OTPs — orderVerifications (doc ID = orderId)
  const deliverySnap = await db.collection("orderVerifications").get();
  const orderIds = deliverySnap.docs.map((d: any) => d.id);
  const orderMobileMap: Record<string, { mobile: string; orderNo: string }> = {};
  if (orderIds.length > 0) {
    const orderDocs = await Promise.all(orderIds.map((oid: any) => db.collection("orders").doc(oid).get()));
    orderDocs.forEach((od: any) => {
      if (od.exists) {
        const data = od.data()!;
        orderMobileMap[od.id] = {
          mobile: (data.phone as string) || (data.customer as string) || "—",
          orderNo: (data.orderNo as string) || od.id.slice(0, 8).toUpperCase(),
        };
      }
    });
  }
  const deliveryOtps = deliverySnap.docs.map((doc: any) => ({
    id: doc.id,
    mobile: orderMobileMap[doc.id]?.mobile || "—",
    otp: (doc.data().otp as string) || "—",
    source: "Delivery",
    label: orderMobileMap[doc.id]?.orderNo ? `Order #${orderMobileMap[doc.id].orderNo}` : null,
    expiry: toISO(doc.data().otpExpiry),
    updatedAt: toISO(doc.data().updatedAt),
  }));

  const all = [...adminOtps, ...checkoutOtps, ...deliveryOtps].sort(
    (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json({ otps: all });
}

async function deleteHandler(request: Request, { logAction }: { logAction: any }) {
  const { id, source } = await request.json();
  if (source === "Checkout") {
    await db.collection("phoneVerifications").doc(id).delete();
  } else if (source === "Admin Login") {
    await db.collection("admins").doc(id).update({ otp: null, otpExpiry: null });
  } else if (source === "Delivery") {
    await db.collection("orderVerifications").doc(id).delete();
  }

  await logAction("DELETE_OTP", { otpId: id, source });

  return NextResponse.json({ success: true });
}

export const GET = withAdminAuth(getHandler, PERMISSIONS.VIEW_OTP_VERIFICATIONS);
export const DELETE = withAdminAuth(deleteHandler, PERMISSIONS.VIEW_OTP_VERIFICATIONS);
