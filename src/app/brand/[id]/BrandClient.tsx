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
    banner?: string;
    bannerMobile?: string;
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

export default function BrandClient() {
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
            const foundBrand = brandsList.find((b: Brand) => b.id === id) ?? null;
            setBrand(foundBrand);
            if (foundBrand) {
                setProducts(productsList.filter((p) => p.brand === id));
            }
        }).catch(() => {
            setBrand(null);
            setProducts([]);
        }).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        const initSwiper = () => {
            if (typeof window !== "undefined" && (window as any).Swiper) {
                document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
                    if (!swiperElement.classList.contains("swiper-initialized")) {
                        const configEl = swiperElement.querySelector(".swiper-config");
                        if (configEl) {
                            try {
                                let config = JSON.parse(configEl.innerHTML.trim());
                                new (window as any).Swiper(swiperElement, config);
                            } catch (e) {
                                console.error("Failed to parse swiper config", e);
                            }
                        }
                    }
                });
            }
        };
        if (!loading && brand) {
            initSwiper();
            const timer = setTimeout(initSwiper, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, brand]);

    if (loading) {
        return (
            <div className="brand-page">
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

    const banners = brand.banner?.split(',').filter(Boolean) || [];
    const mobileBanners = brand.bannerMobile?.split(',').filter(Boolean) || [];
    const hasDesktopMultiple = banners.length > 1;
    const hasMobileMultiple = mobileBanners.length > 1 || (mobileBanners.length === 0 && banners.length > 1);

    const swiperConfig = {
        "loop": true,
        "speed": 1000,
        "autoplay": { "delay": 5000, "disableOnInteraction": false },
        "slidesPerView": 1,
        "effect": "fade",
        "fadeEffect": { "crossFade": true },
        "pagination": { "el": ".swiper-pagination", "type": "bullets", "clickable": true }
    };

    return (
        <div className="brand-page" style={{ marginTop: '132px' }}>
            {/* Desktop Banner Slider (Hidden on Mobile) */}
            {banners.length > 0 && (
                <div className={`collection-banner overflow-hidden d-none d-md-block ${hasDesktopMultiple ? 'swiper init-swiper' : ''}`} style={{ minHeight: '200px' }}>
                    {hasDesktopMultiple && (
                        <script type="application/json" className="swiper-config">
                            {JSON.stringify(swiperConfig)}
                        </script>
                    )}
                    
                    <div className={hasDesktopMultiple ? "swiper-wrapper" : ""}>
                        {banners.map((url, index) => (
                            <div key={`desktop-${index}`} className={hasDesktopMultiple ? "swiper-slide" : ""}>
                                <img
                                    src={url}
                                    alt={`${brand.name} desktop banner ${index + 1}`}
                                    className="w-100 object-fit-cover"
                                    style={{ height: '650px' }}
                                />
                            </div>
                        ))}
                    </div>
                    {hasDesktopMultiple && <div className="swiper-pagination"></div>}
                </div>
            )}

            {/* Mobile Banner Slider (Hidden on Desktop) */}
            {(mobileBanners.length > 0 || banners.length > 0) && (
                <div className={`collection-banner overflow-hidden d-block d-md-none ${hasMobileMultiple ? 'swiper init-swiper' : ''}`} style={{ minHeight: '200px' }}>
                    {hasMobileMultiple && (
                        <script type="application/json" className="swiper-config">
                            {JSON.stringify(swiperConfig)}
                        </script>
                    )}
                    
                    <div className={hasMobileMultiple ? "swiper-wrapper" : ""}>
                        {mobileBanners.length > 0 ? (
                            mobileBanners.map((url, index) => (
                                <div key={`mobile-${index}`} className={hasMobileMultiple ? "swiper-slide" : ""}>
                                    <img
                                        src={url}
                                        alt={`${brand.name} mobile banner ${index + 1}`}
                                        className="w-100 object-fit-cover"
                                        style={{ aspectRatio: '8/12', height: 'auto', maxHeight: '500px' }}
                                    />
                                </div>
                            ))
                        ) : (
                            banners.map((url, index) => (
                                <div key={`fallback-${index}`} className={hasMobileMultiple ? "swiper-slide" : ""}>
                                    <img
                                        src={url}
                                        alt={`${brand.name} banner fallback ${index + 1}`}
                                        className="w-100 object-fit-cover"
                                        style={{ height: '250px' }}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                    {hasMobileMultiple && <div className="swiper-pagination"></div>}
                </div>
            )}

            {/* <section id="brand-header" className="section light-background pt-4 pb-5" data-aos="fade-up">
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
            </section> */}

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
