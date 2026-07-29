"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { BrandOrCategoryPageShimmer } from "@/components/Shimmer";

interface Category {
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

export default function CategoryClient() {
    const { id } = useParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<SiteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        Promise.all([
            fetch("/api/site/categories").then((r) => r.json()),
            fetch("/api/site/products").then((r) => r.json()),
        ]).then(([categoriesRes, productsRes]) => {
            const categoriesList = categoriesRes.categories ?? [];
            const productsList = (productsRes.products ?? []) as SiteProduct[];
            if (id === 'all') {
                setCategory({
                    id: 'all',
                    name: 'All Products',
                    summary: 'Explore our complete range of premium products',
                    image: ''
                });
                setProducts(productsList);
            } else {
                setCategory(categoriesList.find((c: Category) => c.id === id) ?? null);
                setProducts(productsList.filter((p) => p.category === id));
            }
        }).catch(() => {
            setCategory(null);
            setProducts([]);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="category-page mt-5 pt-4">
                <BrandOrCategoryPageShimmer cardCount={8} />
            </div>
        );
    }

    if (!category) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <h2>Category not found</h2>
                <Link href="/" className="btn btn-primary mt-3">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="category-page mt-5 pt-1">
            <section id="category-header" className="section dark-background text-white p-0 overflow-hidden'" style={{ minHeight: "300px", display: "flex", alignItems: "center", position: "relative" }}>
                {category.image ? (
                    <img
                        src={category.image}
                        alt={category.name}
                        className="position-absolute w-100 h-100"
                        style={{ objectFit: "cover", opacity: 0.3, zIndex: 0 }}
                    />
                ) : null}
                <div className="container position-relative responsive-banner-container mt-5" style={{ zIndex: 1, padding: "80px 0" }}>
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h1 className="display-4" style={{ fontWeight: 800 }}>{category.name}</h1>
                            <p className="fs-5">{category.summary}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="category-products" className="section">
                <div className="container mt-5">
                    <div className="section-title text-center mb-2">
                        <h2>Explore {category.name}</h2>
                        <p>Premium selection for your daily needs</p>
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
                                <p>No products found in this category yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
