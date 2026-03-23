"use server";

import db from "@/lib/firebase";
import { sendSmsOtp } from "@/lib/sms";
import { revalidatePath } from "next/cache";
import { getAdminSession, logAction } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

interface OrderItem {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
    image?: string | null;
    createdAt: string;
}

interface Order {
    id: string;
    orderNo: string;
    customer: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    shippingName?: string | null;
    shippingAddress?: string | null;
    date: string;
    total: string;
    status: string;
    payment: string;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

function toISO(val: unknown): string {
    if (val && typeof val === "object" && "toDate" in val) return (val as { toDate: () => Date }).toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const doc = await db.collection("orders").doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data()!;
        const norm = (p: unknown) => (/cod|cash|unpaid/i.test(String(p ?? "")) ? "COD" : "UPI");
        const paymentMethod = (data.paymentMethod as string) || norm(data.payment);
        const paymentStatus = (data.paymentStatus as string) || "Pending";
        return {
            id: doc.id,
            orderNo: data.orderNo,
            customer: data.customer,
            email: data.email,
            phone: (data.phone as string) ?? null,
            address: (data.address as string) ?? null,
            city: (data.city as string) ?? null,
            zip: (data.zip as string) ?? null,
            shippingName: (data.shippingName as string) ?? null,
            shippingAddress: (data.shippingAddress as string) ?? null,
            total: data.total,
            status: data.status,
            payment: data.payment,
            paymentMethod: paymentMethod === "COD" || paymentMethod === "UPI" ? paymentMethod : norm(data.payment),
            paymentStatus: paymentStatus === "Paid" ? "Paid" : "Pending",
            date: toISO(data.date),
            createdAt: toISO(data.createdAt),
            updatedAt: toISO(data.updatedAt),
            items: (data.items || []).map((item: Record<string, unknown>) => ({
                id: item.id as string,
                name: item.name as string,
                sku: (item.sku as string | null) ?? null,
                qty: item.qty as number,
                price: item.price as string,
                image: (item.image as string | null) ?? null,
                createdAt: toISO(item.createdAt),
            })),
        };
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return null;
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ORDERS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("orders").doc(id).update({ status });
        
        await logAction(session.email, session.name, "UPDATE_ORDER_STATUS", { orderId: id, status });

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update order status:", error);
        return { success: false, error: "Failed to update order status" };
    }
}

export async function updatePayment(
    id: string,
    paymentMethod: "COD" | "UPI",
    paymentStatus: "Pending" | "Paid"
) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_ORDERS)) {
            return { success: false, error: "Access Denied" };
        }

        await db.collection("orders").doc(id).update({
            payment: paymentMethod,
            paymentMethod,
            paymentStatus,
        });

        await logAction(session.email, session.name, "UPDATE_ORDER_PAYMENT", { orderId: id, paymentMethod, paymentStatus });

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment:", error);
        return { success: false, error: "Failed to update payment" };
    }
}

const ALLOWED_PINCODES_DOC = "delivery";

export async function getAllowedPincodes(): Promise<string[]> {
    try {
        const session = await getAdminSession();
        if (!session) return [];

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PINCODES)) {
            return [];
        }

        const doc = await db.collection("settings").doc(ALLOWED_PINCODES_DOC).get();
        const data = doc.data();
        const list = (data?.allowedPincodes as string[] | undefined) ?? [];
        return Array.isArray(list) ? list.filter((p) => typeof p === "string" && /^\d{6}$/.test(p)) : [];
    } catch (error) {
        console.error("Failed to fetch allowed pincodes:", error);
        return [];
    }
}

export async function addAllowedPincode(pincode: string): Promise<{ success: boolean; error?: string }> {
    const normalized = String(pincode).trim().replace(/\D/g, "");
    if (normalized.length !== 6) {
        return { success: false, error: "Pincode must be 6 digits." };
    }
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PINCODES)) {
            return { success: false, error: "Access Denied" };
        }

        const ref = db.collection("settings").doc(ALLOWED_PINCODES_DOC);
        const doc = await ref.get();
        const current = (doc.data()?.allowedPincodes as string[] | undefined) ?? [];
        if (current.includes(normalized)) {
            return { success: false, error: "This pincode is already in the list." };
        }

        await ref.set({ allowedPincodes: [...current, normalized].sort() }, { merge: true });
        
        await logAction(session.email, session.name, "ADD_PINCODE", { pincode: normalized });

        revalidatePath("/admin/staff/allowed-pincodes");
        return { success: true };
    } catch (error) {
        console.error("Failed to add allowed pincode:", error);
        return { success: false, error: "Failed to add pincode." };
    }
}

export async function removeAllowedPincode(pincode: string): Promise<{ success: boolean; error?: string }> {
    const normalized = String(pincode).trim().replace(/\D/g, "");
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_PINCODES)) {
            return { success: false, error: "Access Denied" };
        }

        const ref = db.collection("settings").doc(ALLOWED_PINCODES_DOC);
        const doc = await ref.get();
        const current = (doc.data()?.allowedPincodes as string[] | undefined) ?? [];
        const next = current.filter((p) => p !== normalized);
        
        await ref.set({ allowedPincodes: next }, { merge: true });

        await logAction(session.email, session.name, "REMOVE_PINCODE", { pincode: normalized });

        revalidatePath("/admin/staff/allowed-pincodes");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove allowed pincode:", error);
        return { success: false, error: "Failed to remove pincode." };
    }
}

export async function sendOrderDeliveryOtp(orderId: string, emailOrPhone: string | null) {
    if (!emailOrPhone) {
        return { success: false, error: "Customer contact info is required to send OTP." };
    }
    try {
        const ref = db.collection("orderVerifications").doc(orderId);
        const doc = await ref.get();
        const existing = doc.data();

        if (existing) {
            const lastRequested = existing.updatedAt?.toDate?.() || new Date(0);
            const secondsSinceLast = (Date.now() - lastRequested.getTime()) / 1000;
            if (secondsSinceLast < 60) {
                return { success: false, error: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting again.` };
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await ref.set({
            otp,
            otpExpiry,
            updatedAt: new Date(),
            attempts: 0
        });

        console.log(`[DELIVERY OTP] Sending via Fast2SMS to ${emailOrPhone} for order ${orderId}: ${otp}`);
        
        const smsSent = await sendSmsOtp(emailOrPhone, otp);
        if (!smsSent) {
            return { success: false, error: "Failed to send delivery OTP SMS." };
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send delivery OTP:", error);
        return { success: false, error: "Failed to send delivery OTP." };
    }
}

export async function verifyOrderDeliveryOtp(orderId: string, otp: string) {
    try {
        const ref = db.collection("orderVerifications").doc(orderId);
        const doc = await ref.get();
        if (!doc.exists) {
            return { success: false, error: "No pending OTP found for this order." };
        }
        
        const data = doc.data();
        if (!data) {
            return { success: false, error: "No pending OTP found for this order." };
        }

        const attempts = data.attempts || 0;
        if (attempts >= 5) {
            return { success: false, error: "Too many failed attempts. Please request a new OTP." };
        }
        
        if (data.otp !== otp) {
            await ref.update({
                attempts: attempts + 1
            });
            return { success: false, error: "Invalid OTP." };
        }
        
        if (data.otpExpiry && data.otpExpiry.toDate() < new Date()) {
            return { success: false, error: "OTP has expired." };
        }

        // Cleanup after success
        await ref.delete();

        return { success: true };
    } catch (error) {
        console.error("Failed to verify delivery OTP:", error);
        return { success: false, error: "Failed to verify OTP." };
    }
}

export async function assignOrderStaff(orderId: string, staffId: string, staffName: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        if (!isSuperAdmin) {
            return { success: false, error: "Access Denied. Only Super Admins can assign orders." };
        }

        await db.collection("orders").doc(orderId).update({
            assignedTo: {
                id: staffId,
                name: staffName,
                assignedAt: new Date()
            }
        });

        await logAction(session.email, session.name, "ASSIGN_ORDER_STAFF", { orderId, staffId, staffName });

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to assign order:", error);
        return { success: false, error: "Failed to assign order." };
    }
}
