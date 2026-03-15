import { NextResponse } from "next/server";
import { getAdminSession, logAction } from "@/lib/auth";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";

type AdminApiHandler = (
    req: Request,
    context: { session: any; logAction: (action: string, details?: any) => Promise<void> }
) => Promise<NextResponse>;

/**
 * Higher-order function to protect admin API routes.
 * Handles:
 * 1. Session verification
 * 2. Optional permission check
 * 3. Injects audit logging helper
 */
export function withAdminAuth(handler: AdminApiHandler, requiredPermission?: string) {
    return async (req: Request, context: any) => {
        try {
            const session = await getAdminSession();
            if (!session) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            if (requiredPermission) {
                const permissionMap = await getRolePermissionsMap();
                const role = session.role;
                const userPermissions = permissionMap[role] || [];
                const isSuperAdmin = role === "Super Admin" || role === "super_admin";

                if (!isSuperAdmin && !userPermissions.includes(requiredPermission)) {
                    return NextResponse.json(
                        { error: `Access Denied: Missing ${requiredPermission} permission` },
                        { status: 403 }
                    );
                }
            }

            const loggingHelper = async (action: string, details: any = {}) => {
                await logAction(session.email, session.name, action, details);
            };

            return await handler(req, { session, logAction: loggingHelper });
        } catch (error) {
            console.error("API Middleware Error:", error);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
}
