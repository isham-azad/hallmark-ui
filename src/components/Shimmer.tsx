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
