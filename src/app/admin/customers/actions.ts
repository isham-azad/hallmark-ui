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
            };
        });
    } catch (error) {
        console.error("Failed to fetch customers:", error);
        return [];
    }
}
