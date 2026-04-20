"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ProductCardShimmer, CategoryFilterShimmer, ShopPageShimmer } from "@/components/Shimmer";
import Image from "next/image";

interface ShopProduct {
    id: string;
    name: string;
    category: string;
    price: number;
    oldPrice: number;
    image: string;
    images: string[];
    description: string;
    sku?: string;
    b2bPricingTiers?: { minQty: number; price: string }[];
}

function mapApiProductToShop(p: {
    id: string;
    title: string;
    desc: string;
    image?: string;
    price?: string;
    wasPrice?: string;
    category: string;
    categoryName?: string;
}): ShopProduct {
    const priceNum = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0 : 0;
    const oldPriceNum = p.wasPrice ? parseFloat(p.wasPrice.replace(/[^0-9.]/g, "")) || 0 : priceNum;
    const defaultImg = "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg";
    const images = (p.image || '').split(',').map(s => s.trim()).filter(Boolean);
    if (images.length === 0) images.push(defaultImg);
    return {
        id: p.id,
        name: p.title,
        category: p.category,
        price: priceNum,
        oldPrice: oldPriceNum,
        image: images[0],
        images,
        description: p.desc || "",
        sku: (p as any).sku || "",
        b2bPricingTiers: (p as any).b2bPricingTiers || [],
    };
}

export default function ShopClient({ initialData }: { initialData?: any }) {
    const { addToCart } = useCart();
    const [products, setProducts] = useState<ShopProduct[]>(
        initialData?.products ? (initialData.products as any[]).map(mapApiProductToShop) : []
    );
    const [categories, setCategories] = useState<{ id: string; name: string }[]>(initialData?.categories ?? []);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("default");
    const [displayCount, setDisplayCount] = useState(8);
    const [productsLoading, setProductsLoading] = useState(!initialData?.products);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [shopBanners, setShopBanners] = useState<{ id: string; image: string; bannerMobile?: string }[]>(initialData?.banners ?? []);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [hoverImgIdx, setHoverImgIdx] = useState(0);
    const hoverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isB2B, setIsB2B] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const router = useRouter();

    const handleProductMouseEnter = (product: ShopProduct) => {
        setHoveredId(product.id);
        setHoverImgIdx(0);
        if (product.images.length > 1) {
            if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
            hoverIntervalRef.current = setInterval(() => {
                setHoverImgIdx(prev => (prev + 1) % product.images.length);
            }, 1200);
        }
    };

    const handleProductMouseLeave = () => {
        setHoveredId(null);
        setHoverImgIdx(0);
        if (hoverIntervalRef.current) {
            clearInterval(hoverIntervalRef.current);
            hoverIntervalRef.current = null;
        }
    };

    useEffect(() => {
        // Always check B2B status
        fetch("/api/b2b/me")
            .then((r) => r.json())
            .then((b2bRes) => setIsB2B(b2bRes.authenticated ?? false))
            .catch(() => setIsB2B(false))
            .finally(() => setAuthChecking(false));

        if (initialData) return;

        setProductsLoading(true);
        Promise.all([
            fetch("/api/site/products").then((r) => r.json()),
            fetch("/api/site/categories").then((r) => r.json()),
            fetch("/api/site/shop-banners").then((r) => r.json()),
        ]).then(([productsRes, categoriesRes, bannersRes]) => {
            const apiProducts = (productsRes.products ?? []) as Array<{ id: string; title: string; desc: string; image?: string; price?: string; wasPrice?: string; category: string; categoryName?: string }>;
            setProducts(apiProducts.map(mapApiProductToShop));
            setCategories(categoriesRes.categories ?? []);
            setShopBanners(bannersRes.banners ?? []);
        }).catch(() => {
            setProducts([]);
            setCategories([]);
            setShopBanners([]);
        }).finally(() => setProductsLoading(false));
    }, [initialData]);

    // Auto-advance shop banners
    useEffect(() => {
        if (shopBanners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % shopBanners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [shopBanners.length]);

    const filteredProducts = products
        .filter((product) => {
            const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                product.name.toLowerCase().includes(q) ||
                product.description.toLowerCase().includes(q);
            const matchesB2B = !isB2B || (product.b2bPricingTiers && product.b2bPricingTiers.some(t => t.price && t.price.trim() !== ""));
            return matchesCategory && matchesSearch && matchesB2B;
        })
        .sort((a, b) => {
            if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
            if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
            if (sortOrder === "price-asc") return a.price - b.price;
            if (sortOrder === "price-desc") return b.price - a.price;
            return 0; // default: original order
        });

    const displayedProducts = filteredProducts.slice(0, displayCount);
    const hasMore = filteredProducts.length > displayCount;

    // Reset count when filters/sort change
    useEffect(() => {
        setDisplayCount(8);
    }, [selectedCategory, searchQuery, sortOrder]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setDisplayCount((prev) => prev + 8);
                        setIsLoadingMore(false);
                    }, 500);
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, displayedProducts.length]);

    // Refresh AOS on new products
    useEffect(() => {
        const refreshAOS = () => {
            if (typeof window !== "undefined" && (window as any).AOS) {
                (window as any).AOS.refresh();
                return true;
            }
            return false;
        };
        if (!refreshAOS()) {
            const interval = setInterval(() => {
                if (refreshAOS()) clearInterval(interval);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [displayCount]);

    useEffect(() => {
        if (!authChecking && !isB2B) {
            router.push("/b2b/login");
        }
    }, [authChecking, isB2B, router]);

    if (authChecking || productsLoading) {
        return <ShopPageShimmer />;
    }

    if (!isB2B) {
        return null; // Avoid flashing while redirecting
    }

    return (
        <>
            {/* Shop Banners Slider */}
            {shopBanners.length > 0 && (
                <div className="container" style={{ marginTop: "160px", marginBottom: "20px" }} data-aos="fade-up">
                    <div className="shop-banner-slider-container">
                        <div className="shop-banner-slider">
                            {shopBanners.map((banner, index) => (
                                <div key={banner.id} className={`banner-slide ${currentBanner === index ? 'active' : ''}`}>
                                    {/* Desktop Banner */}
                                    <div className="d-none d-md-block h-100 w-100 position-relative">
                                        <Image
                                            src={banner.image}
                                            alt={`Promo Banner Desktop ${index}`}
                                            fill
                                            priority={index === 0}
                                            style={{ objectFit: "cover" }}
                                            sizes="100vw"
                                        />
                                    </div>
                                    {/* Mobile Banner */}
                                    <div className="d-block d-md-none h-100 w-100 position-relative">
                                        <Image
                                            src={banner.bannerMobile || banner.image}
                                            alt={`Promo Banner Mobile ${index}`}
                                            fill
                                            priority={index === 0}
                                            style={{ objectFit: "cover" }}
                                            sizes="100vw"
                                        />
                                    </div>
                                    <div className="banner-overlay"></div>
                                </div>
                            ))}
                            {shopBanners.length > 1 && (
                                <div className="slider-dots">
                                    {shopBanners.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentBanner(i)}
                                            className={currentBanner === i ? "active" : ""}
                                            aria-label={`Go to slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .shop-banner-slider-container {
                    position: relative;
                    height: min(400px, 60vw);
                    border-radius: 24px;
                    overflow: hidden;
                    background: #f1f5f9;
                }
                
                @media (max-width: 768px) {
                    .shop-banner-slider-container {
                        height: 250px;
                        border-radius: 16px;
                    }
                }

                .shop-banner-slider {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .banner-slide {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    transform: scale(1.05);
                    transition: opacity 1s ease-in-out, transform 1s ease-in-out;
                    z-index: 0;
                }

                .banner-slide.active {
                    opacity: 1;
                    transform: scale(1);
                    z-index: 1;
                }

                .banner-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3));
                    z-index: 1;
                }

                .slider-dots {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 10px;
                    z-index: 10;
                }

                .slider-dots button {
                    width: 10px;
                    height: 10px;
                    border-radius: 5px;
                    border: none;
                    background: rgba(255,255,255,0.6);
                    cursor: pointer;
                    padding: 0;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .slider-dots button.active {
                    width: 24px;
                    background: #ffc451;
                }
            `}</style>

            {/* Breadcrumbs (Refined) */}
            <div className="page-title mt-2" data-aos="fade">
                <nav className="breadcrumbs" style={{ background: "transparent", borderBottom: "none", padding: "15px 0" }}>
                    <div className="container">
                        <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, gap: '5px', fontSize: '14px', color: '#64748b' }}>
                            <li><Link href="/" style={{ color: '#ffc451', textDecoration: 'none' }}>Home</Link></li>
                            {/* <li style={{ color: '#94a3b8' }}>/</li> */}
                            <li className="current" style={{ color: '#1e293b', fontWeight: '500' }}>Order Online</li>
                        </ol>
                    </div>
                </nav>

                <div className="heading" style={{ paddingTop: '50px' }}>
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-10">
                                <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#221f51", marginBottom: "0.5rem" }}>Order Online</h1>
                                <p className="mb-4" style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "#64748b" }}>Elevate your lifestyle with Hallmark Essentials.</p>
                                <div className="row justify-content-center">
                                    <div className="col-lg-10 col-md-11 col-12">
                                        <div style={{ position: "relative" }}>
                                            <i
                                                className="bi bi-search"
                                                style={{
                                                    position: "absolute",
                                                    left: "20px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    fontSize: "1.1rem",
                                                    color: "#ffc451",
                                                    zIndex: 2,
                                                    pointerEvents: "none"
                                                }}
                                            ></i>
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setDisplayCount(8);
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "16px 52px 16px 52px",
                                                    fontSize: "1.05rem",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "50px",
                                                    background: "#fff",
                                                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                                                    outline: "none",
                                                    color: "#334155",
                                                    transition: "0.3s"
                                                }}
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => { setSearchQuery(""); setDisplayCount(8); }}
                                                    style={{
                                                        position: "absolute",
                                                        right: "12px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        background: "#f1f5f9",
                                                        border: "none",
                                                        borderRadius: "50%",
                                                        width: "32px",
                                                        height: "32px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: "pointer",
                                                        color: "#64748b",
                                                        zIndex: 2,
                                                    }}
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Section */}
            <section id="shop" className="shop section">
                <div className="container">
                    <div className="shop-header mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="shop-title mb-0">
                                {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
                            </h2>
                            <div className="shop-controls d-flex align-items-center gap-3">
                                <span className="d-none d-md-inline text-muted small">Sort By</span>
                                <select
                                    className="form-select sort-select"
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value);
                                        setDisplayCount(8);
                                    }}
                                >
                                    <option value="default">Most Popular</option>
                                    <option value="name-asc">Name: A to Z</option>
                                    <option value="name-desc">Name: Z to A</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-scroll-wrapper">
                            <div id="shop-categories-chips" className="chip-list" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0', border: 'none' }}>
                                <span
                                    role="button"
                                    onClick={() => { setSelectedCategory("all"); setDisplayCount(8); }}
                                    className={`filter-chip ${selectedCategory === "all" ? "active" : ""}`}
                                >
                                    {selectedCategory === "all" && <i className="bi bi-check2 me-1"></i>}
                                    All Products
                                </span>
                                {categories.map((c) => (
                                    <span
                                        key={c.id}
                                        role="button"
                                        onClick={() => { setSelectedCategory(c.id); setDisplayCount(8); }}
                                        className={`filter-chip ${selectedCategory === c.id ? "active" : ""}`}
                                    >
                                        {selectedCategory === c.id && (
                                            <span onClick={(e) => { e.stopPropagation(); setSelectedCategory("all"); }} className="me-2 text-muted">
                                                <i className="bi bi-x-lg" style={{ fontSize: '0.7rem', color: 'white' }}></i>
                                            </span>
                                        )}
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="results-info mt-3">
                            <span className="text-muted small">{filteredProducts.length} Results for <strong>"{selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}"</strong></span>
                        </div>
                    </div>

                    {displayedProducts.length > 0 ? (
                        <div className="row gy-4" id="productsContainer">
                            {displayedProducts.map((product) => (
                                <div key={product.id} className="col-6 col-lg-3 col-md-4 col-sm-6 product-item-wrapper" data-aos="fade-up">
                                    <div
                                        className="product-item"
                                        onMouseEnter={() => handleProductMouseEnter(product)}
                                        onMouseLeave={handleProductMouseLeave}
                                    >
                                        <div className="product-img" style={{ position: "relative" }}>
                                            <span
                                                className="badge bg-success"
                                                style={{
                                                    position: "absolute",
                                                    top: "10px",
                                                    left: "10px",
                                                    zIndex: 3,
                                                    fontSize: "0.6rem",
                                                    fontWeight: "600",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    padding: "5px 10px",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                                }}
                                            >
                                                {product.category === "food-beverages" ? "Food & Beverages" :
                                                    product.category.replace("-", " ")}
                                            </span>
                                            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        width: `${product.images.length * 100}%`,
                                                        height: '100%',
                                                        transform: `translateX(-${product.images.length > 1 ? (hoveredId === product.id ? (hoverImgIdx % product.images.length) * (100 / product.images.length) : 0) : 0}%)`,
                                                        transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                        willChange: 'transform'
                                                    }}
                                                >
                                                    {product.images.map((img, idx) => (
                                                        <div key={idx} style={{ position: 'relative', width: `${100 / product.images.length}%`, height: '100%', padding: '12px' }}>
                                                            <Image
                                                                src={img}
                                                                alt={`${product.name} - ${idx + 1}`}
                                                                fill
                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                                style={{ objectFit: 'contain', padding: '12px' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {product.images.length > 1 && (
                                                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 4 }}>
                                                    {product.images.map((_, dotIdx) => (
                                                        <span
                                                            key={dotIdx}
                                                            style={{
                                                                width: hoveredId === product.id && (hoverImgIdx % product.images.length) === dotIdx ? '14px' : '5px',
                                                                height: '5px',
                                                                borderRadius: '3px',
                                                                background: hoveredId === product.id && (hoverImgIdx % product.images.length) === dotIdx ? '#ffc451' : 'rgba(0,0,0,0.15)',
                                                                transition: 'all 0.4s ease',
                                                                display: 'inline-block',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="product-overlay" style={{ background: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '30px' }}>
                                                <button
                                                    className="add-to-cart-btn"
                                                    style={{
                                                        backgroundColor: '#ffffff',
                                                        color: '#000000',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '10px 22px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase',
                                                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        let finalPrice = product.price;
                                                        if (isB2B && product.b2bPricingTiers && product.b2bPricingTiers.length > 0) {
                                                            const tier1 = product.b2bPricingTiers.find(t => Number(t.minQty) === 1);
                                                            if (tier1) {
                                                                finalPrice = parseFloat(tier1.price.replace(/[^0-9.]/g, "")) || finalPrice;
                                                            }
                                                        }
                                                        addToCart({ id: product.id, name: product.name, price: finalPrice, image: product.image, category: product.category, sku: product.sku }, 1, "Standard");
                                                    }}
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                        <Link href={`/shop/product/${product.id}`}>
                                            <div className="product-info">
                                                <h4>{product.name}</h4>
                                                <p className="product-description">{product.description}</p>
                                                <div className="product-price-container" style={{ marginTop: '12px' }}>
                                                    {(() => {
                                                        let displayPrice = product.price;
                                                        let displayOldPrice = product.oldPrice;

                                                        if (isB2B && product.b2bPricingTiers && product.b2bPricingTiers.length > 0) {
                                                            const tier1 = product.b2bPricingTiers.find(t => Number(t.minQty) === 1);
                                                            if (tier1) {
                                                                displayPrice = parseFloat(tier1.price.replace(/[^0-9.]/g, "")) || displayPrice;
                                                            }
                                                        }

                                                        if (displayPrice > 0) {
                                                            return (
                                                                <>
                                                                    <div className="d-flex align-items-end gap-2 flex-wrap" style={{ color: "#1e293b" }}>
                                                                        <div className="d-flex" style={{ alignItems: 'flex-start' }}>
                                                                            <span style={{ fontSize: "0.75rem", fontWeight: "700", marginTop: "2px", marginRight: "1px", lineHeight: '1' }}>₹</span>
                                                                            <span style={{ fontSize: "1.8rem", fontWeight: "900", lineHeight: "1" }}>
                                                                                {displayPrice.toLocaleString('en-IN')}
                                                                            </span>
                                                                        </div>
                                                                        {displayOldPrice > displayPrice && (
                                                                            <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.85rem", color: "#64748b", paddingBottom: "2px" }}>
                                                                                <span style={{ fontWeight: "500" }}>M.R.P.:</span>
                                                                                <span style={{ textDecoration: "line-through" }}>₹{displayOldPrice.toLocaleString('en-IN')}</span>
                                                                                <span style={{ color: "#ffc451", fontWeight: "700", marginLeft: "2px" }}>({Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100)}% off)</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                                                                            Inclusive of all taxes
                                                                        </div>
                                                                        {/* {isB2B && product.b2bPricingTiers && product.b2bPricingTiers.some(t => Number(t.minQty) === 1 && t.price && t.price.trim() !== "") && (
                                                                        <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>B2B Price</span>
                                                                    )} */}
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                        return <span className="current-price" style={{ fontSize: "0.95rem", fontWeight: "600", color: "#64748b" }}>Contact for Price</span>;
                                                    })()}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="row mt-5" id="noItemsMessage">
                            <div className="col-12 text-center py-5">
                                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "300px" }}>
                                    <i className="bi bi-inbox" style={{ fontSize: "64px", color: "#ccc", marginBottom: "20px" }}></i>
                                    <h4 style={{ color: "#666", marginBottom: "10px" }}>No Products Found</h4>
                                    <p style={{ color: "#999" }}>Sorry, there are no products available in this category at the moment.</p>
                                    <button onClick={() => setSelectedCategory("all")} className="btn btn-primary mt-3">View All Products</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} style={{ height: "1px" }} />

                    {/* Loading more shimmer */}
                    {isLoadingMore && (
                        <div className="row mt-4 gy-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="col-6 col-lg-3 col-md-4 col-sm-6">
                                    <ProductCardShimmer />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* End of results */}
                    {!hasMore && filteredProducts.length > 0 && (
                        <div className="row mt-4">
                            <div className="col-12 text-center">
                                <p style={{ color: "#bbb", fontSize: "0.85rem" }}>— All {filteredProducts.length} products shown —</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
