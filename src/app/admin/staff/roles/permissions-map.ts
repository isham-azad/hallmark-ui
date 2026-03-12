"use server";

import db from "@/lib/firebase";

export async function getRolePermissionsMap(): Promise<Record<string, string[]>> {
    try {
        const [rolesSnap, permsSnap] = await Promise.all([
            db.collection("roles").get(),
            db.collection("permissions").get()
        ]);

        const allPermissionKeys = permsSnap.docs.map(doc => doc.data().key);
        const map: Record<string, string[]> = {};

        rolesSnap.docs.forEach(doc => {
            const data = doc.data();
            const roleName = data.name;

            // Automatically grant all permissions to Super Admin role
            if (roleName === "Super Admin" || roleName === "super_admin") {
                map[roleName] = allPermissionKeys;
            } else {
                map[roleName] = data.permissionKeys || [];
            }
        });

        // Ensure "Super Admin" key exists even if not in DB
        if (!map["Super Admin"]) map["Super Admin"] = allPermissionKeys;
        if (!map["super_admin"]) map["super_admin"] = allPermissionKeys;

        return map;
    } catch (error) {
        console.error("Failed to fetch role permissions map:", error);
        return {};
    }
}
