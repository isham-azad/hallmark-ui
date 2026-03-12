"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductDetailShimmer } from "@/components/Shimmer";

interface SiteProduct {
    id: string;
    title: string;
    category: string;
    brand: string;
    desc: string;
    image?: string;
    price?: string;
    categoryName?: string;
    brandName?: string;
}

interface Brand {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<SiteProduct | null>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        Promise.all([
            fetch("/api/site/products").then((r) => r.json()),
            fetch("/api/site/brands").then((r) => r.json()),
            fetch("/api/site/categories").then((r) => r.json()),
        ]).then(([productsRes, brandsRes, categoriesRes]) => {
            const productsList = (productsRes.products ?? []) as SiteProduct[];
            setProduct(productsList.find((p) => p.id === id) ?? null);
            setBrands(brandsRes.brands ?? []);
            setCategories(categoriesRes.categories ?? []);
        }).catch(() => setProduct(null)).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="product-detail-page mt-0 pt-5">
                <ProductDetailShimmer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <h2>Product not found</h2>
                <Link href="/" className="btn btn-primary mt-3">Back to Home</Link>
            </div>
        );
    }

    const category = categories.find((c) => c.id === product.category);
    const brand = brands.find((b) => b.id === product.brand);

    return (
        <div className="product-detail-page mt-0 pt-5">
            <div className="container py-5">
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                        <li className="breadcrumb-item"><Link href={`/category/${product.category}`}>{category?.name ?? product.categoryName}</Link></li>
                        <li className="breadcrumb-item active" aria-current="page">{product.title}</li>
                    </ol>
                </nav>

                <div className="row gy-5">
                    <div className="col-lg-6">
                        <div className="product-image-container p-4" style={{ backgroundColor: "var(--surface-color)", borderRadius: "20px", border: "1px solid #eee" }}>
                            <img
                                src={product.image || "/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"}
                                alt={product.title}
                                className="img-fluid w-100"
                                style={{ borderRadius: "15px", maxHeight: "500px", objectFit: "cover" }}
                            />
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="product-info ps-lg-4">
                            <span className="badge mb-2" style={{ backgroundColor: "color-mix(in srgb, var(--accent-color), transparent 90%)", color: "var(--accent-color)", fontSize: "0.85rem", fontWeight: "600" }}>
                                {category?.name ?? product.categoryName ?? product.category}
                            </span>
                            <h1 className="fw-bold mb-3">{product.title}</h1>
                            {brand && (
                                <div className="d-flex align-items-center mb-4">
                                    <span className="me-2 text-muted">Brand:</span>
                                    <Link href={`/brand/${brand.id}`} className="fw-bold" style={{ color: "var(--accent-color)", textDecoration: "none" }}>
                                        {brand.name}
                                    </Link>
                                </div>
                            )}

                            <div className="product-price mb-4">
                                {product.price ? (
                                    <h3 className="fw-bold" style={{ color: "var(--accent-color)" }}>₹{product.price}</h3>
                                ) : (
                                    <h3 className="fw-bold" style={{ color: "var(--accent-color)" }}>Contact for Price</h3>
                                )}
                            </div>

                            <div className="product-description mb-5">
                                <h5 className="fw-bold mb-3">Product Description</h5>
                                <p style={{ textAlign: "justify", color: "color-mix(in srgb, var(--default-color), transparent 20%)", lineHeight: "1.8" }}>
                                    {product.desc}
                                </p>
                            </div>

                            <div className="d-flex gap-3 mb-5">
                                <Link
                                    href="/#contact"
                                    className="btn btn-primary px-5 py-3"
                                    style={{ borderRadius: "30px", fontWeight: "600" }}
                                >
                                    <i className="bi bi-envelope me-2"></i> Enquire Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
