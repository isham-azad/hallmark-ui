"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { BrandOrCategoryPageShimmer } from "@/components/Shimmer";

interface Brand {
    id: string;
    name: string;
    summary: string;
    image: string;
}

interface SiteProduct {
    id: string;
    title: string;
    category: string;
    brand: string;
    desc: string;
    image?: string;
    price?: string;
}

export default function BrandPage() {
    const { id } = useParams();
    const [brand, setBrand] = useState<Brand | null>(null);
    const [products, setProducts] = useState<SiteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        Promise.all([
            fetch("/api/site/brands").then((r) => r.json()),
            fetch("/api/site/products").then((r) => r.json()),
        ]).then(([brandsRes, productsRes]) => {
            const brandsList = brandsRes.brands ?? [];
            const productsList = (productsRes.products ?? []) as SiteProduct[];
            setBrand(brandsList.find((b: Brand) => b.id === id) ?? null);
            setProducts(productsList.filter((p) => p.brand === id));
        }).catch(() => {
            setBrand(null);
            setProducts([]);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="brand-page mt-5 pt-4">
                <BrandOrCategoryPageShimmer cardCount={8} />
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <h2>Brand not found</h2>
                <Link href="/" className="btn btn-primary mt-3">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="brand-page mt-5 pt-4">
            <section id="brand-header" className="section light-background py-5">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-4 text-center mb-4 mb-lg-0">
                            {brand.image ? (
                                <img
                                    src={brand.image}
                                    alt={brand.name}
                                    className="img-fluid"
                                    style={{ maxHeight: "150px", objectFit: "contain" }}
                                />
                            ) : (
                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: "150px", height: "150px", margin: "0 auto", fontSize: "3rem", color: "#ccc" }}>
                                    {brand.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="col-lg-8">
                            <h1 style={{ fontWeight: 700, color: "var(--heading-color)" }}>{brand.name}</h1>
                            <p className="lead" style={{ textAlign: "justify", color: "color-mix(in srgb, var(--default-color), transparent 20%)" }}>
                                {brand.summary}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="brand-products" className="section">
                <div className="container">
                    <div className="section-title text-center mb-2">
                        <h2>Our {brand.name} Products</h2>
                        <p>Quality essentials from {brand.name}</p>
                    </div>

                    <div className="row gy-4">
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <div key={product.id} className="col-lg-3 col-md-6 col-6 d-flex align-items-stretch">
                                    <ProductCard product={product} index={index} />
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center">
                                <p>No products found for this brand yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
