"use client";

import React from "react";

export function ShimmerBox({
    className = "",
    style = {},
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return <div className={`shimmer ${className}`} style={style} aria-hidden="true" />;
}

/** Skeleton for product cards (home slider, shop grid, brand/category grids) */
export function ProductCardShimmer({ className = "" }: { className?: string }) {
    return (
        <div
            className={`product-card service-item position-relative d-flex flex-column h-100 ${className}`}
            style={{
                padding: 0,
                overflow: "hidden",
                border: "1px solid color-mix(in srgb, var(--default-color), transparent 90%)",
                borderRadius: "15px",
                backgroundColor: "var(--surface-color)",
            }}
        >
            <ShimmerBox style={{ width: "100%", aspectRatio: "4/3" }} />
            <div className="p-3 p-md-4 d-flex flex-column flex-grow-1">
                <ShimmerBox style={{ height: 20, width: "85%", marginBottom: 12 }} />
                <ShimmerBox style={{ height: 14, width: "100%", marginBottom: 8 }} />
                <ShimmerBox style={{ height: 14, width: "90%", marginBottom: 8 }} />
                <ShimmerBox style={{ height: 14, width: "70%", marginBottom: 16 }} />
                <ShimmerBox style={{ height: 16, width: 120, marginTop: "auto" }} />
            </div>
        </div>
    );
}

/** Two-column product detail skeleton (image left, content right) */
export function ProductDetailShimmer() {
    return (
        <div className="container py-5">
            <div className="row mb-4">
                <ShimmerBox style={{ height: 20, width: 280 }} />
            </div>
            <div className="row gy-5">
                <div className="col-lg-6">
                    <ShimmerBox style={{ width: "100%", aspectRatio: "1", borderRadius: "20px" }} />
                </div>
                <div className="col-lg-6 ps-lg-4">
                    <ShimmerBox style={{ height: 14, width: 80, marginBottom: 16 }} />
                    <ShimmerBox style={{ height: 32, width: "90%", marginBottom: 12 }} />
                    <ShimmerBox style={{ height: 24, width: 120, marginBottom: 24 }} />
                    <ShimmerBox style={{ height: 18, width: "100%", marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 18, width: "100%", marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 18, width: "75%", marginBottom: 32 }} />
                    <ShimmerBox style={{ height: 48, width: 160, borderRadius: "30px" }} />
                </div>
            </div>
        </div>
    );
}

/** Full shop product detail page skeleton (title + image + tabs + sidebar) */
export function ShopProductDetailShimmer() {
    return (
        <>
            <div className="page-title mt-5">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <ShimmerBox style={{ height: 36, width: "70%", margin: "0 auto 12px" }} />
                                <ShimmerBox style={{ height: 18, width: "90%", margin: "0 auto" }} />
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <div className="d-flex gap-2 align-items-center">
                            <ShimmerBox style={{ height: 16, width: 40 }} />
                            <ShimmerBox style={{ height: 16, width: 40 }} />
                            <ShimmerBox style={{ height: 16, width: 120 }} />
                        </div>
                    </div>
                </nav>
            </div>
            <section className="product-details section">
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <ShimmerBox style={{ width: "100%", aspectRatio: "4/3", borderRadius: 12 }} />
                            <div className="mt-5">
                                <div className="d-flex gap-2 mb-0">
                                    <ShimmerBox style={{ height: 40, width: 100 }} />
                                    <ShimmerBox style={{ height: 40, width: 100 }} />
                                    <ShimmerBox style={{ height: 40, width: 100 }} />
                                </div>
                                <ShimmerBox style={{ width: "100%", height: 120, borderTopLeftRadius: 0, borderTopRightRadius: 0 }} />
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <ShimmerBox style={{ height: 24, width: 80, marginBottom: 12 }} />
                            <ShimmerBox style={{ height: 28, width: "90%", marginBottom: 16 }} />
                            <ShimmerBox style={{ height: 32, width: 100, marginBottom: 16 }} />
                            <ShimmerBox style={{ height: 14, width: "100%", marginBottom: 12 }} />
                            <ShimmerBox style={{ height: 14, width: "85%", marginBottom: 24 }} />
                            <ShimmerBox style={{ height: 44, width: "100%", marginBottom: 12 }} />
                            <ShimmerBox style={{ height: 44, width: "100%" }} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

/** Checkout payment methods section: 3 option-style rows */
export function PaymentMethodsShimmer() {
    return (
        <div className="payment-methods d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-3 border-2 shadow-sm d-flex align-items-center">
                    <ShimmerBox style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0, marginRight: 12 }} />
                    <div className="flex-grow-1">
                        <ShimmerBox style={{ height: 18, width: "60%", marginBottom: 8 }} />
                        <ShimmerBox style={{ height: 14, width: "90%" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Section header + grid of product card shimmers (for brand/category pages) */
export function BrandOrCategoryPageShimmer({ cardCount = 8 }: { cardCount?: number }) {
    return (
        <>
            <section className="section light-background" style={{ padding: "60px 0" }}>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-4 text-center mb-4 mb-lg-0">
                            <ShimmerBox style={{ width: 150, height: 150, margin: "0 auto", borderRadius: 12 }} />
                        </div>
                        <div className="col-lg-8">
                            <ShimmerBox style={{ height: 40, width: "60%", marginBottom: 16 }} />
                            <ShimmerBox style={{ height: 16, width: "100%", marginBottom: 8 }} />
                            <ShimmerBox style={{ height: 16, width: "95%", marginBottom: 8 }} />
                            <ShimmerBox style={{ height: 16, width: "80%" }} />
                        </div>
                    </div>
                </div>
            </section>
            <section className="section">
                <div className="container">
                    <div className="section-title text-center mb-5">
                        <ShimmerBox style={{ height: 32, width: 280, margin: "0 auto 12px" }} />
                        <ShimmerBox style={{ height: 18, width: 200, margin: "0 auto" }} />
                    </div>
                    <div className="row gy-4">
                        {Array.from({ length: cardCount }).map((_, i) => (
                            <div key={i} className="col-lg-3 col-md-6">
                                <ProductCardShimmer />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
/** Generic table shimmer for admin lists */
export function TableShimmer({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="table-card" style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <div className="p-4 border-bottom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <ShimmerBox style={{ height: 28, width: 220 }} />
                    <div className="d-flex gap-2 flex-grow-1 justify-content-md-end">
                        <ShimmerBox style={{ height: 44, width: '100%', maxWidth: 300, borderRadius: 12 }} />
                        <ShimmerBox style={{ height: 44, width: 140, borderRadius: 12 }} />
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table mb-0" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {Array.from({ length: cols }).map((_, i) => (
                                <th key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'left', background: '#f8fafc' }}>
                                    <ShimmerBox style={{ height: 12, width: i === 0 ? 30 : 80 }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, ri) => (
                            <tr key={ri}>
                                {Array.from({ length: cols }).map((_, ci) => (
                                    <td key={ci} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Pattern: Circle for first/second col (avatar/thumb) */}
                                            {ci === 0 && (ri % 2 === 0) && (
                                                <ShimmerBox style={{ width: 32, height: 32, borderRadius: ci === 0 ? '50%' : 8, flexShrink: 0 }} />
                                            )}
                                            {/* Pattern: Varied widths */}
                                            <ShimmerBox style={{ 
                                                height: 14, 
                                                width: ci === 0 ? 40 : (ri % 3 === 0 ? '60%' : (ri % 3 === 1 ? '85%' : '40%')),
                                                borderRadius: 4 
                                            }} />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


/** Shimmer for the admin dashboard */
export function AdminDashboardShimmer() {
    return (
        <div className="dashboard-shimmer">
            <div className="row g-4 mb-5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="col-xl-3 col-sm-6">
                        <div className="p-4 rounded-4 bg-white border border-light shadow-sm">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <ShimmerBox style={{ height: 14, width: 100, marginBottom: 8 }} />
                                    <ShimmerBox style={{ height: 28, width: 80 }} />
                                </div>
                                <ShimmerBox style={{ width: 48, height: 48, borderRadius: 12 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="row g-4">
                <div className="col-lg-8">
                    <TableShimmer rows={5} cols={4} />
                </div>
                <div className="col-lg-4">
                    <TableShimmer rows={5} cols={2} />
                </div>
            </div>
        </div>
    );
}
/** Shimmer for forms (add/edit pages) with sectioned layout */
export function FormShimmer() {
    return (
        <div className="admin-form-shimmer" style={{ maxWidth: 900 }}>
            <div className="mb-4">
                <ShimmerBox style={{ height: 20, width: 140 }} />
            </div>

            {[1, 2, 3].map((s) => (
                <div key={s} className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
                    <ShimmerBox style={{ height: 24, width: 180, marginBottom: 30 }} />
                    <div className="row g-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={s === 1 && i <= 2 ? "col-12" : "col-md-6"}>
                                <ShimmerBox style={{ height: 14, width: 120, marginBottom: 8 }} />
                                <ShimmerBox style={{ height: 48, width: '100%', borderRadius: 10 }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="d-flex justify-content-end gap-3 pt-2">
                <ShimmerBox style={{ height: 48, width: 120, borderRadius: 12 }} />
                <ShimmerBox style={{ height: 48, width: 160, borderRadius: 12 }} />
            </div>
        </div>
    );
}

/** Full layout shimmer (sidebar + header + content) */
export function AdminLayoutShimmer() {
    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <aside style={{ width: 280, background: '#fff', borderRight: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ShimmerBox style={{ height: 32, width: 120, marginBottom: 40 }} />
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <ShimmerBox key={i} style={{ height: 48, width: '100%', borderRadius: 12 }} />
                ))}
            </aside>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header style={{ height: 80, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ShimmerBox style={{ height: 24, width: 150 }} />
                    <div className="d-flex align-items-center gap-2">
                        <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                        <div className="d-none d-md-block">
                            <ShimmerBox style={{ height: 12, width: 80, marginBottom: 4 }} />
                            <ShimmerBox style={{ height: 10, width: 60 }} />
                        </div>
                    </div>
                </header>
                <div style={{ padding: '2rem' }}>
                    <AdminDashboardShimmer />
                </div>
            </main>
        </div>
    );
}
/** Shimmer for card grids (Brands, Categories) */
export function AdminGridShimmer({ type = 'brand' }: { type?: 'brand' | 'category' }) {
    return (
        <div className="admin-grid-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <ShimmerBox style={{ height: 28, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 350 }} />
                </div>
                <ShimmerBox style={{ height: 44, width: 180, borderRadius: 12 }} />
            </div>
            
            <div className="mb-4">
                <ShimmerBox style={{ height: 44, width: 400, borderRadius: 12 }} />
            </div>

            <div className="row g-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="col-xl-3 col-lg-4 col-sm-6">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100">
                            {type === 'category' ? (
                                <ShimmerBox style={{ width: '100%', height: 180 }} />
                            ) : (
                                <div className="p-3 d-flex justify-content-between align-items-start">
                                    <ShimmerBox style={{ width: 60, height: 60, borderRadius: 12 }} />
                                    <div className="d-flex gap-1">
                                        <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                                        <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                                        <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                                    </div>
                                </div>
                            )}
                            <div className="card-body p-4">
                                <ShimmerBox style={{ height: 20, width: '70%', marginBottom: 12 }} />
                                <ShimmerBox style={{ height: 12, width: 60, borderRadius: 20, marginBottom: 16 }} />
                                <ShimmerBox style={{ height: 14, width: '100%', marginBottom: 8 }} />
                                <ShimmerBox style={{ height: 14, width: '90%', marginBottom: 24 }} />
                                <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                                    <ShimmerBox style={{ height: 28, width: 100, borderRadius: 20 }} />
                                    <ShimmerBox style={{ height: 16, width: 120 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Shimmer for admin order detail page */
export function OrderDetailShimmer() {
    return (
        <div className="admin-order-detail-shimmer" style={{ maxWidth: 1000 }}>
            <div className="mb-4 d-flex flex-column gap-3">
                <ShimmerBox style={{ height: 20, width: 140 }} />
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <ShimmerBox style={{ height: 32, width: 250, marginBottom: 8 }} />
                        <ShimmerBox style={{ height: 16, width: 180 }} />
                    </div>
                    <div className="d-flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <ShimmerBox key={i} style={{ width: 40, height: 40, borderRadius: 12 }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
                <div className="row g-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={i >= 8 ? "col-12" : "col-md-6"}>
                            <ShimmerBox style={{ height: 12, width: 100, marginBottom: 8 }} />
                            <ShimmerBox style={{ height: 20, width: '80%' }} />
                        </div>
                    ))}
                </div>
                
                <div className="mt-5 pt-4 border-top">
                    <ShimmerBox style={{ height: 16, width: 140, marginBottom: 20 }} />
                    <TableShimmer rows={3} cols={4} />
                </div>
            </div>
        </div>
    );
}

/** Shimmer for inventory management (Table + specialized bulk actions) */
export function AdminInventoryShimmer() {
    return (
        <div className="admin-inventory-shimmer">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-4 mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 280, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 220 }} />
                </div>
                <div className="d-flex align-items-center gap-3">
                    <ShimmerBox style={{ height: 44, width: 250, borderRadius: 12 }} />
                    <ShimmerBox style={{ height: 44, width: 200, borderRadius: 12 }} />
                </div>
            </div>
            <TableShimmer rows={8} cols={6} />
        </div>
    );
}

/** Shimmer for pricing management grid cards */
export function AdminPricingShimmer() {
    return (
        <div className="admin-pricing-shimmer">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-4 mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 240, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 350 }} />
                </div>
                <div className="d-flex gap-2">
                    <ShimmerBox style={{ height: 44, width: 220, borderRadius: 12 }} />
                    <ShimmerBox style={{ height: 44, width: 180, borderRadius: 12 }} />
                    <ShimmerBox style={{ height: 44, width: 150, borderRadius: 12 }} />
                </div>
            </div>

            <div className="row g-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="col-xl-4 col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex justify-content-between mb-4">
                                <ShimmerBox style={{ height: 22, width: '60%' }} />
                                <ShimmerBox style={{ height: 20, width: 80, borderRadius: 6 }} />
                            </div>
                            <div className="row g-3">
                                <div className="col-6">
                                    <ShimmerBox style={{ height: 12, width: 80, marginBottom: 8 }} />
                                    <ShimmerBox style={{ height: 40, width: '100%', borderRadius: 8 }} />
                                </div>
                                <div className="col-6">
                                    <ShimmerBox style={{ height: 12, width: 80, marginBottom: 8 }} />
                                    <ShimmerBox style={{ height: 40, width: '100%', borderRadius: 8 }} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <ShimmerBox style={{ height: 44, width: '100%', borderRadius: 10 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Shimmer for payment methods grid */
export function AdminPaymentMethodsShimmer() {
    return (
        <div className="admin-pm-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 300 }} />
                </div>
                <ShimmerBox style={{ height: 48, width: 220, borderRadius: 12 }} />
            </div>

            <div className="mb-4">
                <ShimmerBox style={{ height: 44, width: 350, borderRadius: 12 }} />
            </div>

            <div className="row g-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="col-lg-4 col-md-6 col-sm-12">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <ShimmerBox style={{ width: 60, height: 60, borderRadius: 12 }} />
                                <div className="d-flex gap-1">
                                    <ShimmerBox style={{ width:32, height: 32, borderRadius: 8 }} />
                                    <ShimmerBox style={{ width:32, height: 32, borderRadius: 8 }} />
                                    <ShimmerBox style={{ width:32, height: 32, borderRadius: 8 }} />
                                </div>
                            </div>
                            <ShimmerBox style={{ height: 24, width: '70%', marginBottom: 12 }} />
                            <ShimmerBox style={{ height: 20, width: 60, borderRadius: 20, marginBottom: 16 }} />
                            <ShimmerBox style={{ height: 14, width: '100%', marginBottom: 8 }} />
                            <ShimmerBox style={{ height: 14, width: '90%' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Shimmer for pages with top bar filter tabs (OTP, Staff lists with tabs) */
export function AdminTabbedTableShimmer() {
    return (
        <div className="admin-tabbed-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2">
                    <ShimmerBox style={{ height: 28, width: 120, borderRadius: 20 }} />
                    <ShimmerBox style={{ height: 28, width: 180, borderRadius: 20 }} />
                </div>
                <ShimmerBox style={{ height: 36, width: 100, borderRadius: 10 }} />
            </div>
            
            <div className="d-flex gap-2 mb-4">
                {[1, 2, 3, 4].map(i => (
                    <ShimmerBox key={i} style={{ height: 40, width: 120, borderRadius: 10 }} />
                ))}
            </div>

            <TableShimmer rows={10} cols={6} />
        </div>
    );
}

/** Shimmer for customers management (Table with avatar circles) */
export function AdminCustomersShimmer() {
    return (
        <div className="admin-customers-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 300 }} />
                </div>
            </div>
            
            <div className="table-card border-light shadow-none">
                <div className="p-4 border-bottom">
                    <ShimmerBox style={{ height: 44, width: 380, borderRadius: 12 }} />
                </div>
                <div className="table-responsive">
                    <table className="table mb-0">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <th key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ height: 12, width: 80 }} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 8 }).map((_, ri) => (
                                <tr key={ri}>
                                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                                            <ShimmerBox style={{ height: 16, width: 140 }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="d-flex flex-column gap-2">
                                            <ShimmerBox style={{ height: 12, width: 180 }} />
                                            <ShimmerBox style={{ height: 12, width: 120 }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="d-flex flex-column gap-2">
                                            <ShimmerBox style={{ height: 14, width: 80 }} />
                                            <ShimmerBox style={{ height: 10, width: 150 }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ height: 14, width: 100 }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/** Shimmer for roles management (Grid of cards with permission pills) */
export function AdminRolesShimmer() {
    return (
        <div className="admin-roles-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-4">
                <div>
                    <ShimmerBox style={{ height: 32, width: 200, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 280 }} />
                </div>
                <div className="d-flex gap-3">
                    <ShimmerBox style={{ height: 44, width: 250, borderRadius: 12 }} />
                    <ShimmerBox style={{ height: 44, width: 180, borderRadius: 12 }} />
                </div>
            </div>

            <div className="row g-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="col-xl-4 col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <ShimmerBox style={{ height: 24, width: 140, marginBottom: 8 }} />
                                    <ShimmerBox style={{ height: 12, width: 100 }} />
                                </div>
                                <div className="d-flex gap-1">
                                    <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                                    <ShimmerBox style={{ width: 32, height: 32, borderRadius: 8 }} />
                                </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {Array.from({ length: i + 3 }).map((_, j) => (
                                    <ShimmerBox key={j} style={{ height: 24, width: 80 + (j * 10), borderRadius: 8 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Shimmer for permissions management (Table with code blocks) */
export function AdminPermissionsShimmer() {
    return (
        <div className="admin-permissions-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 280 }} />
                </div>
                <ShimmerBox style={{ height: 48, width: 200, borderRadius: 12 }} />
            </div>

            <div className="table-card border-light shadow-none">
                <div className="p-4 border-bottom">
                    <ShimmerBox style={{ height: 44, width: 350, borderRadius: 12 }} />
                </div>
                <TableShimmer rows={10} cols={4} />
            </div>
        </div>
    );
}

/** Shimmer for allowed pincodes (Specialized layout) */
export function AdminPincodesShimmer() {
    return (
        <div className="admin-pincodes-shimmer">
            <div className="mb-5">
                <ShimmerBox style={{ height: 32, width: 250, marginBottom: 8 }} />
                <ShimmerBox style={{ height: 16, width: '80%' }} />
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-5">
                <div className="border rounded-4 p-4 mb-5" style={{ background: '#fffbf5' }}>
                    <ShimmerBox style={{ height: 20, width: 180, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 14, width: 300, marginBottom: 20 }} />
                    <div className="d-flex gap-0" style={{ maxWidth: 320 }}>
                        <ShimmerBox style={{ height: 50, flex: 1, borderRadius: '12px 0 0 12px' }} />
                        <ShimmerBox style={{ height: 50, width: 100, borderRadius: '0 12px 12px 0' }} />
                    </div>
                </div>

                <div className="pt-4 border-top">
                    <ShimmerBox style={{ height: 20, width: 240, marginBottom: 20 }} />
                    <div className="d-flex flex-wrap gap-3">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <ShimmerBox key={i} style={{ height: 46, width: 120, borderRadius: 12 }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Shimmer for admin orders list table */
export function AdminOrdersListShimmer() {
    return (
        <div className="admin-orders-list-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-4">
                <div>
                    <ShimmerBox style={{ height: 32, width: 200, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 280 }} />
                </div>
                <div className="d-flex gap-3">
                    <ShimmerBox style={{ height: 44, width: 220, borderRadius: 12 }} />
                </div>
            </div>

            <div className="table-card border-light shadow-none">
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <ShimmerBox style={{ height: 44, width: 350, borderRadius: 12 }} />
                    <div className="d-flex gap-2">
                        <ShimmerBox style={{ height: 44, width: 150, borderRadius: 12 }} />
                        <ShimmerBox style={{ height: 44, width: 180, borderRadius: 12 }} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table mb-0">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <th key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ height: 12, width: i === 0 ? 30 : 80 }} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 8 }).map((_, ri) => (
                                <tr key={ri}>
                                    {Array.from({ length: 6 }).map((_, ci) => (
                                        <td key={ci} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                            {ci === 4 || ci === 5 ? (
                                                <ShimmerBox style={{ height: 26, width: 90, borderRadius: 20 }} />
                                            ) : (
                                                <ShimmerBox style={{ height: 14, width: ci === 0 ? 50 : (ci === 1 ? 140 : 80) }} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/** Shimmer for admin products list table */
export function AdminProductsListShimmer() {
    return (
        <div className="admin-products-list-shimmer">
            <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-4">
                <div>
                    <ShimmerBox style={{ height: 32, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 280 }} />
                </div>
                <div className="d-flex gap-3">
                    <ShimmerBox style={{ height: 44, width: 140, borderRadius: 12 }} />
                    <ShimmerBox style={{ height: 44, width: 140, borderRadius: 12 }} />
                </div>
            </div>

            <div className="table-card border-light shadow-none">
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <ShimmerBox style={{ height: 44, width: 350, borderRadius: 12 }} />
                    <div className="d-flex gap-2">
                        <ShimmerBox style={{ height: 44, width: 160, borderRadius: 12 }} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table mb-0">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <th key={i} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ height: 12, width: i === 0 ? 40 : 100 }} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 10 }).map((_, ri) => (
                                <tr key={ri}>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ width: 44, height: 44, borderRadius: 8 }} />
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <ShimmerBox style={{ height: 16, width: 180, marginBottom: 8 }} />
                                        <ShimmerBox style={{ height: 10, width: 120 }} />
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}><ShimmerBox style={{ height: 14, width: 80 }} /></td>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}><ShimmerBox style={{ height: 14, width: 80 }} /></td>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}><ShimmerBox style={{ height: 16, width: 70, fontWeight: 700 }} /></td>
                                    <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}><ShimmerBox style={{ height: 26, width: 80, borderRadius: 20 }} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/** Shimmer for Activity/Audit Logs page */
export function AdminLogsShimmer() {
    return (
        <div className="admin-logs-shimmer">
            <div className="d-flex justify-content-between align-items-start mb-5">
                <div>
                    <ShimmerBox style={{ height: 32, width: 220, marginBottom: 8 }} />
                    <ShimmerBox style={{ height: 16, width: 400 }} />
                </div>
                <ShimmerBox style={{ height: 44, width: 140, borderRadius: 12 }} />
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <div className="logs-list">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 border-bottom d-flex gap-3">
                            <ShimmerBox style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                            <div className="flex-grow-1">
                                <div className="d-flex gap-2 mb-2 align-items-center">
                                    <ShimmerBox style={{ height: 16, width: 120 }} />
                                    <ShimmerBox style={{ height: 22, width: 100, borderRadius: 20 }} />
                                </div>
                                <ShimmerBox style={{ height: 60, width: '100%', borderRadius: 8, marginBottom: 12, background: '#f8fafc' }} />
                                <div className="d-flex gap-2">
                                    <ShimmerBox style={{ height: 12, width: 150 }} />
                                    <ShimmerBox style={{ height: 12, width: 100 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
