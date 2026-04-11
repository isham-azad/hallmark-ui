"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShopProductDetailShimmer } from "@/components/Shimmer";
import Image from "next/image";

interface SiteProduct {
    id: string;
    title: string;
    category: string;
    brand: string;
    desc: string;
    image?: string;
    price?: string;
    wasPrice?: string;
    categoryName?: string;
    brandName?: string;
    howToUse?: string;
    sku?: string;
    isReturnable?: boolean;
    isDeliveredByHallmark?: boolean;
    isFreeDelivery?: boolean;
    isSecureTransaction?: boolean;
    b2bPricingTiers?: { minQty: number; price: string }[];
    itemWeight?: string;
    itemDimensions?: string;
    scent?: string;
    skinType?: string;
    itemPackageQuantity?: string;
    productBenefits?: string;
    specialFeature?: string;
    itemForm?: string;
    numberOfItems?: string;
    specifications?: { name: string; value: string }[];
}

interface Brand {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductDetailClient() {
    const { id } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<SiteProduct | null>(null);

    const [relatedProducts, setRelatedProducts] = useState<SiteProduct[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedPack, setSelectedPack] = useState("Standard");
    const [pincode, setPincode] = useState("");
    const [pincodeStatus, setPincodeStatus] = useState<"none" | "available" | "unavailable" | "checking">("none");
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Hover state for related products
    const [hoveredRelatedId, setHoveredRelatedId] = useState<string | null>(null);
    const [hoverImgIdx, setHoverImgIdx] = useState(0);
    const [hoverIntervalId, setHoverIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isB2B, setIsB2B] = useState(false);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        setActiveImageIndex(0);
        Promise.all([
            fetch("/api/site/products").then((r) => r.json()),
            fetch("/api/site/brands").then((r) => r.json()),
            fetch("/api/site/categories").then((r) => r.json()),
            fetch("/api/b2b/me").then((r) => r.json()).catch(() => ({ authenticated: false })),
        ]).then(([productsRes, brandsRes, categoriesRes, b2bRes]) => {
            const productsList = (productsRes.products ?? []) as SiteProduct[];
            const found = productsList.find((p) => p.id === id) ?? null;
            setProduct(found);
            setBrands(brandsRes.brands ?? []);
            setCategories(categoriesRes.categories ?? []);
            setIsB2B(b2bRes.authenticated ?? false);
            if (found) {
                const related = productsList
                    .filter((p) => p.id !== id && (p.category === found.category || p.brand === found.brand))
                    .filter((p) => !b2bRes.authenticated || (p.b2bPricingTiers && p.b2bPricingTiers.length > 0))
                    .slice(0, 4);
                setRelatedProducts(related);
            } else {
                setRelatedProducts([]);
            }
        }).catch(() => {
            setProduct(null);
            setRelatedProducts([]);
        }).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!loading && !isB2B) {
            router.push("/b2b/login");
        }
    }, [loading, isB2B, router]);

    const checkPincode = async () => {
        const normalized = pincode.trim().replace(/\D/g, "");
        if (normalized.length !== 6) {
            alert("Please enter a valid 6-digit pincode");
            return;
        }
        setPincodeStatus("checking");
        try {
            const res = await fetch(`/api/site/check-pincode?pincode=${encodeURIComponent(normalized)}`);
            const data = await res.json();
            setPincodeStatus(data.available ? "available" : "unavailable");
        } catch {
            setPincodeStatus("unavailable");
        }
    };

    const handleRelatedMouseEnter = (productId: string, imagesCount: number) => {
        if (imagesCount <= 1) return;
        setHoveredRelatedId(productId);
        setHoverImgIdx(0);
        const interval = setInterval(() => {
            setHoverImgIdx((prev) => prev + 1);
        }, 1200);
        setHoverIntervalId(interval);
    };

    const handleRelatedMouseLeave = () => {
        if (hoverIntervalId) clearInterval(hoverIntervalId);
        setHoveredRelatedId(null);
        setHoverImgIdx(0);
        setHoverIntervalId(null);
    };

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
    }, [product]);

    if (loading) {
        return (
            <>
                <ShopProductDetailShimmer />
            </>
        );
    }

    if (!isB2B) {
        return null;
    }

    if (!product) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <h2>Product not found</h2>
                <Link href="/shop" className="btn btn-primary mt-3">Back to Shop</Link>
            </div>
        );
    }

    const category = categories.find((c) => c.id === product.category);
    const brand = brands.find((b) => b.id === product.brand);
    const categoryName = category?.name ?? product.categoryName ?? product.category;
    const brandName = brand?.name ?? product.brandName ?? product.brand;

    const images = product.image ? product.image.split(',').filter(Boolean) : ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"];
    const imageUrl = images[activeImageIndex];

    const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

    const parsePrice = (p?: string) => {
        if (!p) return 0;
        return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
    };

    let displayPrice = parsePrice(product.price);
    let displayWasPrice = parsePrice(product.wasPrice);

    if (isB2B && product.b2bPricingTiers && product.b2bPricingTiers.length > 0) {
        const tier1 = product.b2bPricingTiers.find(t => Number(t.minQty) === 1);
        if (tier1) {
            displayPrice = parsePrice(tier1.price);
            // displayWasPrice remains the original wasPrice (MRP)
        }
    }

    // Fallback if wasPrice is not set or same as price
    if (displayWasPrice <= displayPrice) {
        displayWasPrice = displayPrice;
    }

    const cartProduct = {
        id: product.id,
        name: product.title,
        price: displayPrice,
        image: imageUrl,
        category: categoryName,
        sku: product.sku || "",
    };

    const handleBuyNow = () => {
        addToCart(cartProduct, quantity, selectedPack, false);
        router.push("/checkout");
    };

    return (
        <>
            <div className="page-title" data-aos="fade" style={{ marginTop: "100px" }}>
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>{product.title}</h1>
                                <p className="mb-0">{product.desc.slice(0, 120)}{product.desc.length > 120 ? "…" : ""}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/shop">Shop</Link></li>
                            <li className="current">{product.title}</li>
                        </ol>
                    </div>
                </nav>
            </div>

            <section id="product-details" className="product-details section">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="product-details-slider-wrapper mb-4">
                                <div className="main-image-preview mb-3" style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #eee', aspectRatio: '1/1' }}>
                                    <div className="shop-slider-track" style={{ display: 'flex', transform: `translateX(-${activeImageIndex * 100}%)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', height: '100%' }}>
                                        {images.map((img, idx) => (
                                            <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', position: 'relative' }}>
                                                <Image
                                                    src={img}
                                                    alt={`${product.title} - ${idx + 1}`}
                                                    fill
                                                    style={{ objectFit: 'contain' }}
                                                    priority={idx === 0}
                                                    sizes="(max-width: 992px) 100vw, 66vw"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="slider-nav-btn prev"
                                                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '5', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="slider-nav-btn next"
                                                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '5', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </>
                                    )}

                                    {images.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: '5' }}>
                                            {images.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    style={{
                                                        width: activeImageIndex === idx ? '24px' : '8px',
                                                        height: '8px',
                                                        borderRadius: '4px',
                                                        background: activeImageIndex === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.6)',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {images.length > 1 && (
                                    <div className="thumbnail-list d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                                        {images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveImageIndex(idx)}
                                                className="shop-thumbnail-item"
                                                style={{
                                                    width: '70px',
                                                    height: '70px',
                                                    flexShrink: 0,
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: activeImageIndex === idx ? '2px solid var(--accent-color)' : '1px solid #eee',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-5">
                                <ul className="nav nav-tabs" id="productTab" role="tablist">
                                    {/* <li className="nav-item" role="presentation">
                                        <button className="nav-link active" id="description-tab" data-bs-toggle="tab" data-bs-target="#description" type="button" role="tab">Description</button>
                                    </li> */}
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">Product Details</button>
                                    </li>
                                    {product.howToUse && (
                                        <li className="nav-item" role="presentation">
                                            <button className="nav-link" id="howto-tab" data-bs-toggle="tab" data-bs-target="#howto" type="button" role="tab">How to Use</button>
                                        </li>
                                    )}
                                </ul>
                                <div className="tab-content border border-top-0 p-4 rounded-bottom" id="productTabContent">
                                    {/* <div className="tab-pane fade show active" id="description" role="tabpanel">
                                        <p>{product.desc}</p>
                                    </div> */}
                                    <div className="tab-pane fade show active" id="details" role="tabpanel">
                                        <div className="specs-grid">
                                            <div className="spec-item">
                                                <span className="spec-label">Brand</span>
                                                <span className="spec-value"><Link href={`/brand/${product.brand}`}>{brandName}</Link></span>
                                            </div>
                                            <div className="spec-item">
                                                <span className="spec-label">Category</span>
                                                <span className="spec-value"><Link href={`/category/${product.category}`}>{categoryName}</Link></span>
                                            </div>
                                            {product.specifications && product.specifications.map((spec, idx) => (
                                                <div key={idx} className="spec-item">
                                                    <span className="spec-label">{spec.name}</span>
                                                    <span className="spec-value">{spec.value}</span>
                                                </div>
                                            ))}
                                            <div className="spec-item">
                                                <span className="spec-label">Sold by</span>
                                                <span className="spec-value">Hallmark Enterprises</span>
                                            </div>
                                        </div>
                                    </div>
                                    {product.howToUse && (
                                        <div className="tab-pane fade" id="howto" role="tabpanel">
                                            <div style={{ whiteSpace: 'pre-line' }}>{product.howToUse}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="product-info">
                                <span className="badge bg-success mb-2">{categoryName}</span>
                                <h3>{product.title}</h3>
                                <div className="product-price mb-3">
                                    {displayPrice > 0 ? (
                                        <div style={{ fontFamily: 'inherit' }}>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                {displayWasPrice > displayPrice && (
                                                    <span style={{ color: "#ffc451", fontSize: "1.75rem", fontWeight: "350" }}>
                                                        -{Math.round(((displayWasPrice - displayPrice) / displayWasPrice) * 100)}%
                                                    </span>
                                                )}
                                                <div className="d-flex align-items-start" style={{ lineHeight: "1" }}>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: "400", marginRight: "2px", color: "#0F1111", marginTop: "0.3rem" }}>₹</span>
                                                    <span style={{ fontSize: "2.4rem", fontWeight: "700", lineHeight: "1", color: "#0F1111" }}>
                                                        {Math.floor(displayPrice).toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: "400", marginTop: "0.3rem", color: "#0F1111" }}>
                                                        {((displayPrice % 1).toFixed(2).substring(2) === "00") ? "" : (displayPrice % 1).toFixed(2).substring(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {displayWasPrice > displayPrice && (
                                                <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.95rem" }}>
                                                    <span>M.R.P.:</span>
                                                    <del>₹{displayWasPrice.toLocaleString()}</del>
                                                </div>
                                            )}

                                            <div style={{ fontSize: "0.95rem", color: "#0F1111" }}>Inclusive of all taxes</div>

                                            {/* {isB2B && (
                                                <div className="badge bg-primary mt-2">B2B Special Pricing Applied</div>
                                            )} */}
                                        </div>
                                    ) : (
                                        <span className="h4 text-primary fw-bold">Contact for Price</span>
                                    )}
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                    <div className="stars me-2">
                                        <i className="bi bi-star-fill text-warning"></i>
                                        <i className="bi bi-star-fill text-warning"></i>
                                        <i className="bi bi-star-fill text-warning"></i>
                                        <i className="bi bi-star-fill text-warning"></i>
                                        <i className="bi bi-star-half text-warning"></i>
                                    </div>
                                    <small className="text-muted">Trusted by thousands of households</small>
                                </div>

                                <p className="product-description">{product.desc.slice(0, 200)}{product.desc.length > 200 ? "…" : ""}</p>

                                {/* <ul className="list-unstyled mb-4">
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Quality assured</li>
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>From Hallmark Enterprises</li>
                                </ul> */}

                                <div className="product-trust-badges mb-4">
                                    <div className="d-flex justify-content-between text-center gap-2">
                                        <div className="trust-badge-item" style={{ flex: '1' }}>
                                            <div className="badge-icon-wrapper mx-auto mb-2">
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 8l-2-2H5L3 8v10a2 2 0 002 2h14a2 2 0 002-2V8z" stroke="#64748b" />
                                                    <path d="M3 8h18M10 12h4" stroke="#64748b" />
                                                    <path d="M16 11c0-1.5-1.5-3-3-3s-3 1.5-3 3" stroke="#64748b" />
                                                    <path d="M9 11l1-1-1-1" stroke="#64748b" />
                                                </svg>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#1e3a8a', display: 'block', lineHeight: '1.2' }}>
                                                {product.isReturnable === false ? 'Non-Returnable' : 'Returnable'}
                                            </span>
                                        </div>
                                        <div className="trust-badge-item" style={{
                                            flex: '1',
                                            display: (product.isDeliveredByHallmark ?? true) ? 'flex' : 'none'
                                        }}>
                                            <div className="badge-icon-wrapper mx-auto mb-2">
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="1" y="3" width="15" height="13" stroke="#64748b" />
                                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#64748b" />
                                                    <circle cx="5.5" cy="18.5" r="2.5" stroke="#64748b" />
                                                    <circle cx="18.5" cy="18.5" r="2.5" stroke="#64748b" />
                                                    <path d="M16 11c1-1 2-1 3 0" stroke="#f59e0b" />
                                                </svg>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#1e3a8a', display: 'block', lineHeight: '1.2' }}>
                                                Hallmark Delivered
                                            </span>
                                        </div>
                                        <div className="trust-badge-item" style={{
                                            flex: '1',
                                            display: (product.isFreeDelivery ?? false) ? 'flex' : 'none'
                                        }}>
                                            <div className="badge-icon-wrapper mx-auto mb-2">
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10 17h4V5H2v12h3" stroke="#64748b" />
                                                    <path d="M20 17h2v-3.34a4 4 0 00-1.17-2.83L19 9h-5" stroke="#64748b" />
                                                    <circle cx="7.5" cy="17.5" r="2.5" stroke="#64748b" />
                                                    <circle cx="17.5" cy="17.5" r="2.5" stroke="#64748b" />
                                                    <text x="6" y="11" fontSize="5" fontWeight="900" fill="#f59e0b" stroke="none">FREE</text>
                                                </svg>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#1e3a8a', display: 'block', lineHeight: '1.2' }}>
                                                Free Delivery
                                            </span>
                                        </div>
                                        <div className="trust-badge-item" style={{
                                            flex: '1',
                                            display: (product.isSecureTransaction ?? true) ? 'flex' : 'none'
                                        }}>
                                            <div className="badge-icon-wrapper mx-auto mb-2">
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#64748b" />
                                                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#64748b" />
                                                    <text x="10" y="18" fontSize="6" fontWeight="900" fill="#f59e0b" stroke="none">$</text>
                                                </svg>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#1e3a8a', display: 'block', lineHeight: '1.2' }}>
                                                Secure transaction
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="product-options mb-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Quantity:</label>
                                        <div className="quantity-selector d-flex align-items-center gap-2">
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                                            <input
                                                type="number"
                                                className="form-control text-center"
                                                value={quantity}
                                                readOnly
                                                style={{ width: "80px" }}
                                            />
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setQuantity((q) => Math.min(10, q + 1))}>+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="product-actions">
                                    <button
                                        className="btn btn-primary btn-lg w-100 mb-2"
                                        onClick={() => addToCart(cartProduct, quantity, selectedPack)}
                                    >
                                        <i className="bi bi-cart-plus me-2"></i>Add to Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="btn btn-outline-primary btn-lg w-100 mb-3 text-center d-block"
                                    >
                                        <i className="bi bi-bag-check me-2"></i>Buy Now
                                    </button>
                                </div>

                                <div className="pincode-checker mt-4 pt-4 border-top">
                                    <h5 className="mb-3">Check Delivery Availability</h5>
                                    <div className="input-group mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter your Pincode"
                                            maxLength={6}
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
                                        />
                                        <button className="btn btn-primary" type="button" onClick={checkPincode} disabled={pincodeStatus === "checking"}>
                                            {pincodeStatus === "checking" ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-search me-1"></i>Check</>}
                                        </button>
                                    </div>
                                    {pincodeStatus !== "none" && pincodeStatus !== "checking" && (
                                        <div className="mt-2">
                                            {pincodeStatus === "available" ? (
                                                <div className="alert alert-success">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    <strong>Available!</strong> Delivery in 3–5 business days.
                                                </div>
                                            ) : (
                                                <div className="alert alert-danger">
                                                    <i className="bi bi-x-circle me-2"></i>
                                                    <strong>Not Available</strong> for delivery at this pincode.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-top">
                                    <p className="mb-1"><i className="bi bi-building me-2 text-muted"></i><strong>Sold by:</strong> Hallmark Enterprises</p>
                                    <p className="mb-1"><i className="bi bi-tag me-2 text-muted"></i><strong>Brand:</strong> <Link href={`/brand/${product.brand}`}>{brandName}</Link></p>
                                    {/* <p className="mb-0"><i className="bi bi-shield-check me-2 text-muted"></i><strong>Quality Assured</strong> — Every batch tested</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {relatedProducts.length > 0 && (
                <section className="shop section pt-0">
                    <div className="container">
                        <div className="row mb-4">
                            <div className="col-12">
                                <h3 className="mb-0">You May Also Like</h3>
                            </div>
                        </div>
                        <div className="row gy-4">
                            {relatedProducts.map((p) => {
                                const pImages = p.image ? p.image.split(',').filter(Boolean) : ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"];

                                let displayPrice = parsePrice(p.price);

                                if (isB2B && p.b2bPricingTiers && p.b2bPricingTiers.length > 0) {
                                    const tier1 = p.b2bPricingTiers.find(t => Number(t.minQty) === 1);
                                    if (tier1) {
                                        displayPrice = parseFloat(tier1.price.replace(/[^0-9.]/g, "")) || displayPrice;
                                    }
                                }

                                return (
                                    <div key={p.id} className="col-6 col-lg-3 col-md-4 col-sm-6 product-item-wrapper" data-aos="fade-up">
                                        <div
                                            className="product-item"
                                            onMouseEnter={() => handleRelatedMouseEnter(p.id, pImages.length)}
                                            onMouseLeave={handleRelatedMouseLeave}
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
                                                    {categories.find((c) => c.id === p.category)?.name ?? p.categoryName}
                                                </span>
                                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            width: `${pImages.length * 100}%`,
                                                            height: '100%',
                                                            transform: `translateX(-${pImages.length > 1 ? (hoveredRelatedId === p.id ? (hoverImgIdx % pImages.length) * (100 / pImages.length) : 0) : 0}%)`,
                                                            transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                            willChange: 'transform'
                                                        }}
                                                    >
                                                        {pImages.map((img, idx) => (
                                                            <div key={idx} style={{ position: 'relative', width: `${100 / pImages.length}%`, height: '100%', padding: '12px' }}>
                                                                <Image
                                                                    src={img}
                                                                    alt={`${p.title} - ${idx + 1}`}
                                                                    fill
                                                                    style={{ objectFit: 'contain', padding: '12px' }}
                                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {pImages.length > 1 && (
                                                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 4 }}>
                                                        {pImages.map((_, dotIdx) => (
                                                            <span
                                                                key={dotIdx}
                                                                style={{
                                                                    width: hoveredRelatedId === p.id && (hoverImgIdx % pImages.length) === dotIdx ? '14px' : '5px',
                                                                    height: '5px',
                                                                    borderRadius: '3px',
                                                                    background: hoveredRelatedId === p.id && (hoverImgIdx % pImages.length) === dotIdx ? '#ffc451' : 'rgba(0,0,0,0.15)',
                                                                    transition: 'all 0.4s ease',
                                                                    display: 'inline-block',
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="product-overlay">
                                                    <Link href={`/shop/product/${p.id}`} className="btn btn-sm btn-primary add-to-cart-btn">
                                                        View Product
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="product-info">
                                                <h4><Link href={`/shop/product/${p.id}`}>{p.title}</Link></h4>

                                                <div className="product-price-container" style={{ marginTop: '12px' }}>
                                                    {p.price ? (
                                                        <>
                                                            <div className="d-flex align-items-end gap-2 flex-wrap" style={{ color: "#1e293b" }}>
                                                                <div className="d-flex" style={{ alignItems: 'flex-start' }}>
                                                                    <span style={{ fontSize: "0.75rem", fontWeight: "700", marginTop: "2px", marginRight: "1px", lineHeight: '1' }}>₹</span>
                                                                    <span style={{ fontSize: "1.8rem", fontWeight: "900", lineHeight: "1" }}>
                                                                        {(parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0).toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                                {p.wasPrice && (
                                                                    <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.85rem", color: "#64748b", paddingBottom: "2px" }}>
                                                                        <span style={{ fontWeight: "500" }}>M.R.P.:</span>
                                                                        <span style={{ textDecoration: "line-through" }}>₹{(parseFloat(p.wasPrice.replace(/[^0-9.]/g, "")) || 0).toLocaleString('en-IN')}</span>
                                                                        <span style={{ color: "#ffc451", fontWeight: "700", marginLeft: "2px" }}>({Math.round(((parseFloat(p.wasPrice.replace(/[^0-9.]/g, "")) - parseFloat(p.price.replace(/[^0-9.]/g, ""))) / parseFloat(p.wasPrice.replace(/[^0-9.]/g, ""))) * 100)}% off)</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                                                                Inclusive of all taxes
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="current-price" style={{ fontSize: "0.95rem", fontWeight: "600", color: "#64748b" }}>Contact for Price</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
            <style jsx>{`
                .slider-nav-btn {
                    transition: all 0.2s ease;
                    opacity: 0.6;
                }
                .slider-nav-btn:hover {
                    opacity: 1;
                    background: white !important;
                    transform: translateY(-50%) scale(1.05) !important;
                }
                .shop-thumbnail-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .thumbnail-list::-webkit-scrollbar {
                    display: none;
                }
                .badge-icon-wrapper {
                    width: 45px;
                    height: 45px;
                    background: #f8fafc;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .trust-badge-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                .trust-badge-item:hover {
                    transform: translateY(-2px);
                }
                .specs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                    background: #f8fafc;
                    padding: 25px;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                }
                .spec-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .spec-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #94a3b8;
                    font-weight: 600;
                }
                .spec-value {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #334155;
                }
            `}</style>
        </>
    );
}
