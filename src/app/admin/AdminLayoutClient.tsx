"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/app/admin/orders/actions";
import { Role, PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "@/app/admin/staff/roles/permissions-map";
import { AdminLayoutShimmer, AdminDashboardShimmer } from "@/components/Shimmer";

interface NavItem {
  name: string;
  icon: string;
  href: string;
  permission?: string;
  subItems?: {
    name: string;
    href: string;
    permission?: string;
  }[];
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdminsOpen, setIsAdminsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: Role } | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: "bi bi-grid-fill", href: "/admin", permission: PERMISSIONS.VIEW_DASHBOARD },
    {
      name: "Catalog",
      icon: "bi bi-collection-fill",
      href: "#",
      subItems: [
        { name: "Brands", href: "/admin/brands", permission: PERMISSIONS.MANAGE_BRANDS },
        { name: "Categories", href: "/admin/categories", permission: PERMISSIONS.MANAGE_CATEGORIES },
      ],
    },
    {
      name: "Products",
      icon: "bi bi-box-seam-fill",
      href: "#",
      subItems: [
        { name: "Products List", href: "/admin/products", permission: PERMISSIONS.MANAGE_PRODUCTS },
        { name: "Inventory", href: "/admin/products/inventory", permission: PERMISSIONS.MANAGE_INVENTORY },
        { name: "Prices", href: "/admin/products/prices", permission: PERMISSIONS.MANAGE_PRICES },
      ],
    },
    {
      name: "Orders",
      icon: "bi bi-cart-fill",
      href: "#",
      subItems: [
        { name: "Orders List", href: "/admin/orders", permission: PERMISSIONS.MANAGE_ORDERS },
        { name: "Allowed Pincodes", href: "/admin/orders/allowed-pincodes", permission: PERMISSIONS.MANAGE_PINCODES },
      ],
    },
    {
      name: "Customers",
      icon: "bi bi-people-fill",
      href: "/admin/customers",
      permission: PERMISSIONS.MANAGE_CUSTOMERS,
    },
    {
      name: "Admins",
      icon: "bi bi-shield-lock-fill",
      href: "#",
      subItems: [
        { name: "Admins List", href: "/admin/staff", permission: PERMISSIONS.MANAGE_ADMINS },
        { name: "Roles", href: "/admin/staff/roles", permission: PERMISSIONS.MANAGE_ROLES },
        { name: "Permissions", href: "/admin/staff/permissions", permission: PERMISSIONS.MANAGE_ROLES },
        { name: "OTP Verifications", href: "/admin/otp-verifications", permission: PERMISSIONS.VIEW_OTP_VERIFICATIONS },
      ],
    },
    {
      name: "Payment",
      icon: "bi bi-credit-card-fill",
      href: "#",
      subItems: [
        { name: "Payment Methods", href: "/admin/payment-methods", permission: PERMISSIONS.MANAGE_PAYMENTS },
      ],
    },
  ];

  const getFilteredItemsForUser = (role: string, permissionsMap: Record<string, string[]>) => {
    const isSuperAdmin = role === "Super Admin" || role === "super_admin";
    const userPermissions = permissionsMap[role] || [];

    return navItems.map(item => {
      // Filter sub items first
      const filteredSubItems = item.subItems?.filter(sub => {
        if (!sub.permission) return true;
        if (isSuperAdmin) return true;
        return userPermissions.includes(sub.permission);
      });

      // Special case for parents: if href is "#", it ONLY depends on subItems
      if (item.href === "#") {
        if (!filteredSubItems || filteredSubItems.length === 0) return null;
        return { ...item, subItems: filteredSubItems };
      }

      // For standalone links
      const isItemAllowed = !item.permission || isSuperAdmin || userPermissions.includes(item.permission);
      if (!isItemAllowed) return null;

      return { ...item, subItems: filteredSubItems };
    }).filter(item => item !== null) as NavItem[];
  };

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    const userStr = localStorage.getItem("admin_user");

    if (!auth && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (auth) {
      setIsAuthenticated(true);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setAdminUser(user);
          // Fetch dynamic permissions map
          getRolePermissionsMap().then(map => {
            setRolePermissions(map);

            // If on root dashboard or unauthorized page, check for redirect
            if (pathname === "/admin") {
              const isSuperAdmin = user.role === "Super Admin" || user.role === "super_admin";
              const userPermissions = map[user.role] || [];
              const hasDashboard = isSuperAdmin || userPermissions.includes(PERMISSIONS.VIEW_DASHBOARD);

              if (!hasDashboard) {
                const authorizedItems = getFilteredItemsForUser(user.role, map);
                const firstItem = authorizedItems[0];

                if (firstItem) {
                  const targetHref = firstItem.href !== "#" ? firstItem.href : firstItem.subItems?.[0]?.href;
                  if (targetHref && targetHref !== "/admin") {
                    router.replace(targetHref);
                  }
                }
              }
            }
          });
        } catch (e) {
          console.error("Failed to parse admin user", e);
        }
      }
    }
    setLoading(false);
  }, [pathname, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const segments = pathname.split("/");
    const subPage = segments[3];
    const isAllowedPincodes = pathname === "/admin/orders/allowed-pincodes";
    const isOrderDetail = pathname.startsWith("/admin/orders/") && segments[2] === "orders" && subPage && subPage !== "allowed-pincodes";
    const orderId = isOrderDetail ? subPage : null;

    if (isAllowedPincodes) {
      setHeaderTitle("Allowed Pincodes");
    } else if (pathname === "/admin/staff") {
      setHeaderTitle("Admins List");
    } else if (orderId) {
      setHeaderTitle(null);
      getOrderById(orderId).then((order) => {
        if (order) setHeaderTitle(order.orderNo);
        else setHeaderTitle(orderId);
      });
    } else {
      setHeaderTitle(null);
    }
  }, [pathname]);

  if (loading) return <AdminLayoutShimmer />;

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }


  const filteredNavItems = adminUser && Object.keys(rolePermissions).length > 0
    ? getFilteredItemsForUser(adminUser.role, rolePermissions)
    : [];

  // Route protection logic
  const isAuthorized = () => {
    if (pathname === "/admin/login") return true;
    if (!adminUser) return false;
    if (Object.keys(rolePermissions).length === 0) return "loading"; // Distinct state

    if (adminUser.role === "Super Admin" || adminUser.role === "super_admin") return true;

    const userPermissions = rolePermissions[adminUser.role] || [];

    // Find if the current path matches any nav item or sub item
    let requiredPermission: string | null = null;
    let pathFound = false;

    // Direct match or parent match
    for (const item of navItems) {
      if (item.href === pathname) {
        requiredPermission = item.permission || null;
        pathFound = true;
        break;
      }
      if (item.subItems) {
        const subMatch = item.subItems.find(sub => sub.href === pathname);
        if (subMatch) {
          requiredPermission = subMatch.permission || null;
          pathFound = true;
          break;
        }
      }
    }

    if (!pathFound) return true;
    if (!requiredPermission) return true;

    const isAllowed = userPermissions.includes(requiredPermission);

    // If not allowed on dashboard, we are redirecting in useEffect.
    // Return "loading" to prevent flashing "Access Denied".
    if (!isAllowed && pathname === "/admin") return "loading";

    return isAllowed;
  };

  const authorized = isAuthorized();

  return (
    <div className={`admin-layout ${isMobileMenuOpen ? "mobile-menu-active" : ""}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"} ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/admin" className="logo">
            <img src="/assets/img/logo-white.png" alt="HallMark Logo" className="logo-img" />
          </Link>
          <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <i className={`bi ${isSidebarOpen ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => (
            <div key={item.name} className="sb-item-wrapper">
              {item.subItems ? (
                <>
                  <button
                    className={`sb-link has-dropdown ${(item.name === "Products" && isProductsOpen) || (item.name === "Catalog" && isCatalogOpen) || (item.name === "Orders" && isOrdersOpen) || (item.name === "Admins" && isAdminsOpen) || (item.name === "Payment" && isPaymentOpen) ? "active" : ""}`}
                    onClick={() => {
                      if (item.name === "Products") setIsProductsOpen(!isProductsOpen);
                      if (item.name === "Catalog") setIsCatalogOpen(!isCatalogOpen);
                      if (item.name === "Orders") setIsOrdersOpen(!isOrdersOpen);
                      if (item.name === "Admins") setIsAdminsOpen(!isAdminsOpen);
                      if (item.name === "Payment") setIsPaymentOpen(!isPaymentOpen);
                    }}
                  >
                    <div className="sb-icon"><i className={item.icon}></i></div>
                    <span className="sb-label">{item.name}</span>
                    <i className={`bi bi-chevron-down sb-arrow ${(item.name === "Products" && isProductsOpen) || (item.name === "Catalog" && isCatalogOpen) || (item.name === "Orders" && isOrdersOpen) || (item.name === "Admins" && isAdminsOpen) || (item.name === "Payment" && isPaymentOpen) ? "rotate" : ""}`}></i>
                  </button>
                  <div className={`sb-submenu ${(item.name === "Products" && isProductsOpen) || (item.name === "Catalog" && isCatalogOpen) || (item.name === "Orders" && isOrdersOpen) || (item.name === "Admins" && isAdminsOpen) || (item.name === "Payment" && isPaymentOpen) ? "expanded" : ""}`}>
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`sb-submenu-item ${pathname === subItem.href ? "active" : ""}`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`sb-link ${pathname === item.href ? "active" : ""}`}
                >
                  <div className="sb-icon"><i className={item.icon}></i></div>
                  <span className="sb-label">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem("admin_auth");
            router.push("/admin/login");
          }}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? "" : "collapsed"}`}>
        <header className="content-header">
          <div className="header-left">
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <i className="bi bi-list"></i>
            </button>
            <h2>{headerTitle ?? pathname.split("/").pop()?.replace(/-/g, " ") ?? "Dashboard"}</h2>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="avatar">{adminUser?.name?.substring(0, 2).toUpperCase() || "AD"}</div>
              <div className="user-info mobile-hidden">
                <span className="user-name">{adminUser?.name || "Admin User"}</span>
                <span className="user-role">{adminUser?.role?.replace("_", " ") || "Administrator"}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="content-inner">
          {authorized === "loading" ? (
            <div className="w-100 h-100">
              <AdminDashboardShimmer />
            </div>
          ) : authorized ? children : (
            <div className="access-denied">
              <div className="denied-card">
                <i className="bi bi-shield-slash-fill"></i>
                <h1>Access Denied</h1>
                <p>You don't have permission to access <strong>{pathname}</strong>.</p>
                <button onClick={() => router.push("/admin")} className="back-btn">Go to Dashboard</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        /* Auth Loading */
        .auth-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 1rem;
            color: #64748b;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f1f5f9;
            border-top: 3px solid #ffc451;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        /* Access Denied Styles */
        .access-denied {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }
        .denied-card {
          padding: 3rem;
          background: #fff;
          border-radius: 24px;
          border: 1px solid #fee2e2;
          max-width: 400px;
          width: 100%;
        }
        .denied-card i {
          font-size: 4rem;
          color: #ef4444;
          margin-bottom: 1.5rem;
          display: block;
        }
        .denied-card h1 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #0f172a;
        }
        .denied-card p {
          color: #64748b;
          margin-bottom: 2rem;
        }
        .denied-card .back-btn {
          background: #0f172a;
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Inter', system-ui, sans-serif;
          --admin-content-padding: 2rem;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px !important;
          background: #ffffff !important;
          border-right: 1px solid #e2e8f0 !important;
          height: 100vh !important;
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          z-index: 1000 !important;
          box-shadow: 4px 0 10px rgba(0, 0, 0, 0.02) !important;
          transition: width 0.3s ease !important;
        }

        .sidebar.closed {
          width: 80px !important;
        }

        .sidebar-header {
          padding: 0 1.5rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          border-bottom: 1px solid #f1f5f9 !important;
          height: 80px !important;
          flex-shrink: 0 !important;
          position: relative !important;
        }

        .logo {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          text-decoration: none !important;
          max-width: 150px !important;
          height: 100% !important;
        }

        .logo-img {
          height: 32px !important;
          width: auto !important;
          filter: brightness(0) !important;
          transition: all 0.3s ease !important;
        }

        .sidebar.closed .logo-img {
          width: 32px !important;
          height: 32px !important;
          object-fit: cover !important;
          object-position: left !important;
        }

        .toggle-btn {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #64748b !important;
          width: 28px !important;
          height: 28px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          position: absolute !important;
          right: -14px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 100 !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
        }

        .sidebar.closed .sidebar-header {
          padding: 0 !important;
          justify-content: center !important;
        }

        .sidebar.closed .logo {
          max-width: 32px !important;
          overflow: hidden !important;
        }

        .toggle-btn:hover {
          background: #ffc451 !important;
          color: #fff !important;
          border-color: #ffc451 !important;
        }

        .sidebar-nav {
          flex: 1 !important;
          padding: 1.5rem 0.75rem !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          overflow-y: auto !important;
        }

        .sb-item-wrapper {
          width: 100% !important;
          margin-bottom: 2px !important;
        }

        .sb-link {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-start !important;
          padding: 12px 16px !important;
          color: #1e293b !important;
          text-decoration: none !important;
          border-radius: 12px !important;
          width: 100% !important;
          background: transparent !important;
          border: none !important;
          font-family: inherit !important;
          font-size: 0.9375rem !important;
          font-weight: 600 !important;
          transition: 0.2s !important;
          cursor: pointer !important;
        }

        .sb-link:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        .sb-link.active {
          background: #fff8eb !important;
          color: #0f172a !important;
          box-shadow: inset 0 0 0 1px #fff2d9 !important;
        }

        .sb-icon {
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 1.2rem !important;
          margin-right: 12px !important;
          flex-shrink: 0 !important;
          color: #64748b !important;
        }

        .sb-link.active .sb-icon {
          color: #ffc451 !important;
        }

        .sb-label {
          white-space: nowrap !important;
          flex-grow: 1 !important;
          color: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          text-align: left !important;
        }

        .sidebar.closed .sb-label,
        .sidebar.closed .sb-arrow {
          display: none !important;
        }

        .sidebar.closed .sb-link {
          justify-content: center !important;
          padding: 12px 0 !important;
        }

        .sidebar.closed .sb-icon {
          margin-right: 0 !important;
        }

        .sb-arrow {
          font-size: 0.75rem !important;
          margin-left: auto !important;
          transition: transform 0.2s !important;
          color: #94a3b8 !important;
        }

        .sb-arrow.rotate {
          transform: rotate(180deg) !important;
        }

        .sb-submenu {
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          margin-left: 2.25rem;
          border-left: 1px solid #e2e8f0;
          padding-left: 0.5rem;
        }

        .sb-submenu.expanded {
          max-height: 500px;
          margin: 8px 0 12px 2.25rem;
        }

        .sb-submenu-item {
          padding: 8px 16px !important;
          color: #64748b !important;
          text-decoration: none !important;
          font-size: 0.875rem !important;
          border-radius: 8px !important;
          transition: 0.2s !important;
          font-weight: 500 !important;
          display: block !important;
        }

        .sb-submenu-item:hover, .sb-submenu-item.active {
          color: #0f172a !important;
          background: #f8fafc !important;
        }

        .sb-submenu-item.active {
          color: #ffc451 !important;
          font-weight: 700 !important;
        }

        .sidebar.closed .sb-submenu {
          display: none !important;
        }

        .sidebar-footer {
          padding: 1.25rem !important;
          border-top: 1px solid #f1f5f9 !important;
        }

        .logout-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 12px !important;
          width: 100% !important;
          padding: 12px !important;
          background: #fff !important;
          border: 1px solid #fee2e2 !important;
          color: #ef4444 !important;
          border-radius: 12px !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
        }

        .logout-btn:hover {
          background: #ef4444 !important;
          color: #fff !important;
        }

        .sidebar.closed .logout-btn span {
          display: none !important;
        }

        /* Main Content */
        .main-content {
          flex: 1 !important;
          margin-left: 280px !important;
          min-height: 100vh !important;
          transition: margin-left 0.3s ease !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .main-content.collapsed {
          margin-left: 80px !important;
        }

        .content-header {
          height: 80px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 var(--admin-content-padding, 2rem) !important;
          background: #fff !important;
          border-bottom: 1px solid #e2e8f0 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
        }

        .header-left {
          flex: 1 !important;
          min-width: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 1rem !important;
        }

        .mobile-toggle {
          display: none !important;
        }

        .header-left h2 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #0f172a !important;
          margin: 0 !important;
          text-transform: capitalize !important;
        }

        .user-profile {
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          padding: 8px 16px !important;
          border-radius: 12px !important;
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }

        .avatar {
          width: 32px !important;
          height: 32px !important;
          background: #ffc451 !important;
          color: #fff !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          font-size: 0.8rem !important;
        }

        .user-info {
          display: flex !important;
          flex-direction: column !important;
        }

        .user-name {
          font-size: 0.85rem !important;
          font-weight: 700 !important;
          color: #0f172a !important;
          line-height: 1.2 !important;
        }

        .user-role {
          font-size: 0.7rem !important;
          color: #64748b !important;
          line-height: 1.2 !important;
        }

        .content-inner {
          padding: var(--admin-content-padding, 2rem) !important;
          flex: 1 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        @media (max-width: 1024px) {
          .mobile-hidden { display: none !important; }
          .mobile-toggle {
              display: flex !important;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              margin-right: 0.25rem;
              cursor: pointer;
              color: #0f172a;
              font-size: 1.25rem;
          }
          .sidebar-overlay {
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              backdrop-filter: blur(4px);
              z-index: 999;
          }
          .sidebar {
            left: -280px !important;
            transition: left 0.3s ease !important;
          }
          .sidebar.mobile-open {
            left: 0 !important;
          }
          .sidebar.closed {
              width: 280px !important; /* On mobile always full width when open */
          }
          .sidebar.closed .sb-label, .sidebar.closed .sb-arrow {
              display: block !important;
          }
          .main-content, .main-content.collapsed {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .toggle-btn { display: none !important; }
          .content-header { padding: 0 1rem !important; }
          .content-inner { padding: 1rem !important; }
          
          /* Common Responsive Table Fixes */
          .table-responsive {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
              margin: 0 -1rem;
              padding: 0 1rem;
              width: calc(100% + 2rem);
          }
          
          .page-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 1rem !important;
          }
          .header-actions {
              width: 100% !important;
              justify-content: flex-start !important;
              flex-direction: column !important;
              align-items: stretch !important;
          }
          .search-box { max-width: none !important; }
          .add-btn { width: 100% !important; justify-content: center !important; }
        }

        @media (max-width: 640px) {
            .denied-card { padding: 2rem 1.5rem !important; }
            .user-profile { padding: 4px !important; border: none !important; background: transparent !important; }
            .header-left h2 { font-size: 1.1rem !important; }
            .header-left { gap: 0.5rem !important; }
        }

        @media print {
          .sidebar, .content-header, .toggle-btn, .sidebar-header, .sidebar-footer, .logout-btn {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .content-inner {
            padding: 0 !important;
          }
          .admin-layout {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
