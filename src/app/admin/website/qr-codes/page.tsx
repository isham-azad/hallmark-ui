import { db } from "@/lib/firebase";
import QrCodeClient from "./QrCodeClient";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function QrCodesPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }

    const permissionMap = await getRolePermissionsMap();
    const role = session.role;
    const userPermissions = permissionMap[role] || [];
    const isSuperAdmin = role === "Super Admin" || role === "super_admin";

    if (!isSuperAdmin && !userPermissions.includes(PERMISSIONS.MANAGE_QR_CODES)) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p>You do not have permission to manage QR codes.</p>
            </div>
        );
    }

    // Since we created an API route, we could fetch from API, but we can also fetch directly here for the initial load if we want.
    // For simplicity, we will just render the client component and let it fetch via the API to have a unified loading state.

    return <QrCodeClient />;
}
