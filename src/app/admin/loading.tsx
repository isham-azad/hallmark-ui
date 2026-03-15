"use client";

import { usePathname } from "next/navigation";
import { 
    TableShimmer, 
    AdminDashboardShimmer, 
    FormShimmer, 
    AdminGridShimmer, 
    OrderDetailShimmer,
    AdminInventoryShimmer,
    AdminPricingShimmer,
    AdminPaymentMethodsShimmer,
    AdminTabbedTableShimmer,
    AdminCustomersShimmer,
    AdminRolesShimmer,
    AdminPermissionsShimmer,
    AdminPincodesShimmer,
    AdminOrdersListShimmer,
    AdminProductsListShimmer,
    AdminLogsShimmer
} from "@/components/Shimmer";

export default function AdminLoading() {
    const pathname = usePathname();

    const segments = pathname.split("/");

    // Check if we are on the main dashboard
    if (pathname === "/admin") {
        return <AdminDashboardShimmer />;
    }

    // Specialized Management Pages
    if (pathname === "/admin/products/inventory") {
        return <AdminInventoryShimmer />;
    }
    if (pathname === "/admin/products/prices") {
        return <AdminPricingShimmer />;
    }
    if (pathname === "/admin/staff/payment-methods") {
        return <AdminPaymentMethodsShimmer />;
    }
    if (pathname === "/admin/otp-verifications") {
        return <AdminTabbedTableShimmer />;
    }

    // Check for brands/categories grid (exact match for root list)
    if (pathname === "/admin/brands") {
        return <AdminGridShimmer type="brand" />;
    }
    if (pathname === "/admin/categories") {
        return <AdminGridShimmer type="category" />;
    }

    if (pathname === "/admin/customers") {
        return <AdminCustomersShimmer />;
    }
    if (pathname === "/admin/staff/roles") {
        return <AdminRolesShimmer />;
    }
    if (pathname === "/admin/staff/permissions") {
        return <AdminPermissionsShimmer />;
    }
    if (pathname === "/admin/staff/allowed-pincodes") {
        return <AdminPincodesShimmer />;
    }
    if (pathname === "/admin/staff/enquiries") {
        return <AdminTabbedTableShimmer />;
    }
    if (pathname === "/admin/staff/logs") {
        return <AdminLogsShimmer />;
    }

    // Order Detail Page (e.g. /admin/orders/[id])
    if (segments[1] === "admin" && segments[2] === "orders" && segments[3] && segments[3] !== "allowed-pincodes") {
        return <OrderDetailShimmer />;
    }

    // Check for add/edit pages
    if (pathname.includes("/add") || pathname.includes("/edit")) {
        return <FormShimmer />;
    }

    // List Pages (Products, Orders)
    if (pathname === "/admin/products") {
        return <AdminProductsListShimmer />;
    }
    if (pathname === "/admin/orders") {
        return <AdminOrdersListShimmer />;
    }

    // Customer / Staff List Page
    if (pathname === "/admin/customers" || pathname === "/admin/staff") {
        return <AdminCustomersShimmer />;
    }

    // Default for all other admin list pages
    return (
        <div className="admin-page-loading">
            <TableShimmer rows={10} cols={5} />
        </div>
    );
}



