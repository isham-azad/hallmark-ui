"use server";

import db from "@/lib/firebase";
import { getAdminSession } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

export interface AuditLog {
    id: string;
    email: string;
    name: string;
    action: string;
    details: any;
    timestamp: string;
}

function toISO(val: any): string {
    if (val && typeof val === "object" && "toDate" in val) return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    return new Date().toISOString();
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    try {
        const session = await getAdminSession();
        if (!session) return [];

        const permissionMap = await getRolePermissionsMap();
        const userPermissions = permissionMap[session.role] || [];
        const isSuperAdmin = session.role === "Super Admin" || session.role === "super_admin";
        
        if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.VIEW_LOGS)) {
            return [];
        }

        const snapshot = await db.collection("auditLogs").orderBy("timestamp", "desc").limit(100).get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.adminEmail || data.email || "Unknown",
                name: data.adminName || data.name || "System",
                action: data.action || "Unknown",
                details: data.details || {},
                timestamp: data.timestamp || new Date().toISOString(),
            };
        });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return [];
    }
}
