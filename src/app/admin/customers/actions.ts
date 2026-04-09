"use server";

import db from "@/lib/firebase";
import { getAdminSession } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    shippingName?: string | null;
    shippingAddress?: string | null;
    createdAt?: string;
    updatedAt?: string;
    subscribed?: boolean;
}

function toISO(val: any): string {
    if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getCustomers(): Promise<Customer[]> {
    try {
        const session = await getAdminSession();
        if (!session) return [];

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_CUSTOMERS)) {
            return [];
        }

        const snapshot = await db.collection("customers").orderBy("updatedAt", "desc").get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                email: data.email || "",
                phone: data.phone || "",
                address: data.address || "",
                city: data.city || "",
                zip: data.zip || "",
                shippingName: data.shippingName || null,
                shippingAddress: data.shippingAddress || null,
                createdAt: toISO(data.createdAt),
                updatedAt: toISO(data.updatedAt),
                subscribed: data.subscribed || false,
            };
        });
    } catch (error) {
        console.error("Failed to fetch customers:", error);
        return [];
    }
}

export async function getCustomerDetail(id: string) {
    try {
        const session = await getAdminSession();
        if (!session) return null;

        const doc = await db.collection("customers").doc(id).get();
        if (!doc.exists) return null;
        const customerData = doc.data()!;

        // Fetch Orders by email (retail customers identified by email/userId)
        const ordersSnap = await db.collection("orders").where("email", "==", customerData.email).get();
        const orders = ordersSnap.docs.map((doc: any) => {
            const d = doc.data();
            return {
                id: doc.id,
                orderNo: d.orderNo,
                total: d.total,
                status: d.status,
                paymentStatus: d.paymentStatus || "Pending",
                createdAt: d.createdAt?.toDate?.() ? d.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        // Sort by date manually to avoid index requirement
        orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
            customer: {
                id: doc.id,
                firstName: customerData.firstName || "",
                lastName: customerData.lastName || "",
                email: customerData.email || "",
                phone: customerData.phone || "",
                address: customerData.address || "",
                city: customerData.city || "",
                zip: customerData.zip || "",
                subscribed: customerData.subscribed || false,
                createdAt: toISO(customerData.createdAt),
                updatedAt: toISO(customerData.updatedAt),
            },
            orders
        };
    } catch (error) {
        console.error("Failed to fetch customer detail:", error);
        return null;
    }
}
