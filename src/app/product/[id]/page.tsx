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
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        setActiveImageIndex(0);
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


    const images = product.image ? product.image.split(',').filter(Boolean) : ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"];
    const category = categories.find((c) => c.id === product.category);
    const brand = brands.find((b) => b.id === product.brand);

    const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

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
                        <div className="product-gallery">
                            <div className="main-image-container mb-3" style={{ position: 'relative', backgroundColor: "var(--surface-color)", borderRadius: "20px", border: "1px solid #eee", overflow: 'hidden' }}>
                                <div className="slider-track" style={{ display: 'flex', transform: `translateX(-${activeImageIndex * 100}%)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%' }}>
                                    {images.map((img, idx) => (
                                        <div key={idx} style={{ flex: '0 0 100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <img
                                                src={img}
                                                alt={`${product.title} - ${idx + 1}`}
                                                className="img-fluid"
                                                style={{ borderRadius: "15px", maxHeight: "500px", width: '100%', objectFit: "cover" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                
                                {images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={prevImage}
                                            className="nav-btn prev"
                                            style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '5', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                        <button 
                                            onClick={nextImage}
                                            className="nav-btn next"
                                            style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '5', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {images.length > 1 && (
                                <div className="thumbnails d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                    {images.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setActiveImageIndex(idx)}
                                            className="thumbnail-item"
                                            style={{ 
                                                width: '80px', 
                                                height: '80px', 
                                                flexShrink: 0, 
                                                cursor: 'pointer', 
                                                borderRadius: '10px', 
                                                overflow: 'hidden', 
                                                border: activeImageIndex === idx ? '2px solid var(--accent-color)' : '2px solid transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            )}
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
            <style jsx>{`
                .nav-btn {
                    transition: all 0.3s ease;
                    opacity: 0.7;
                }
                .nav-btn:hover {
                    opacity: 1;
                    background: white !important;
                    transform: translateY(-50%) scale(1.1) !important;
                }
                .thumbnails::-webkit-scrollbar {
                    display: none;
                }
                .thumbnail-item {
                    transition: transform 0.2s ease;
                }
                .thumbnail-item:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
