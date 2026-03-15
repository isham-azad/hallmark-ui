export type Role = string;

export interface Permission {
    name: string;
    description: string;
}

export const PERMISSIONS = {
    VIEW_DASHBOARD: "view_dashboard",
    MANAGE_BRANDS: "manage_brands",
    MANAGE_CATEGORIES: "manage_categories",
    MANAGE_PRODUCTS: "manage_products",
    MANAGE_INVENTORY: "manage_inventory",
    MANAGE_PRICES: "manage_prices",
    MANAGE_ORDERS: "manage_orders",
    MANAGE_PINCODES: "manage_pincodes",
    MANAGE_CUSTOMERS: "manage_customers",
    MANAGE_ADMINS: "manage_admins",
    MANAGE_ROLES: "manage_roles",
    MANAGE_PAYMENTS: "manage_payments",
    VIEW_REPORTS: "view_reports",
    EXPORT_REPORTS: "export_reports",
    VIEW_OTP_VERIFICATIONS: "view_otp_verifications",
    MANAGE_ENQUIRIES: "manage_enquiries",
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
    super_admin: Object.values(PERMISSIONS),
    order_manager: [
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.MANAGE_CUSTOMERS,
        PERMISSIONS.MANAGE_PINCODES,
        PERMISSIONS.VIEW_REPORTS,
    ],
    product_manager: [
        PERMISSIONS.MANAGE_PRODUCTS,
    ],
    delivery_staff: [
        PERMISSIONS.MANAGE_ORDERS,
    ],
};

export function hasPermission(role: Role, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}
