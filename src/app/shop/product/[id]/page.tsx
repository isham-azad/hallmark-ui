"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShopProductDetailShimmer } from "@/components/Shimmer";

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
}

interface Brand {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ShopProductDetailPage() {
    const { id } = useParams();
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

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        Promise.all([
            fetch("/api/site/products").then((r) => r.json()),
            fetch("/api/site/brands").then((r) => r.json()),
            fetch("/api/site/categories").then((r) => r.json()),
        ]).then(([productsRes, brandsRes, categoriesRes]) => {
            const productsList = (productsRes.products ?? []) as SiteProduct[];
            const found = productsList.find((p) => p.id === id) ?? null;
            setProduct(found);
            setBrands(brandsRes.brands ?? []);
            setCategories(categoriesRes.categories ?? []);
            if (found) {
                const related = productsList
                    .filter((p) => p.id !== id && (p.category === found.category || p.brand === found.brand))
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
    const imageUrl = product.image || "/assets/img/masonry-portfolio/masonry-portfolio-1.jpg";
    const priceNum = product.price ? parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0 : 0;
    const wasPriceNum = product.wasPrice ? parseFloat(product.wasPrice.replace(/[^0-9.]/g, "")) || 0 : priceNum;

    const cartProduct = {
        id: product.id,
        name: product.title,
        price: priceNum,
        image: imageUrl,
        category: categoryName,
    };

    return (
        <>
            <div className="page-title mt-5" data-aos="fade">
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
                            <div className="product-details-slider swiper init-swiper">
                                <div className="swiper-wrapper align-items-center">
                                    <div className="swiper-slide">
                                        <img src={imageUrl} alt={product.title} className="img-fluid" />
                                    </div>
                                </div>
                                <div className="swiper-pagination"></div>
                            </div>

                            <div className="mt-5">
                                <ul className="nav nav-tabs" id="productTab" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link active" id="description-tab" data-bs-toggle="tab" data-bs-target="#description" type="button" role="tab">Description</button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">Product Details</button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="howto-tab" data-bs-toggle="tab" data-bs-target="#howto" type="button" role="tab">How to Use</button>
                                    </li>
                                </ul>
                                <div className="tab-content border border-top-0 p-4 rounded-bottom" id="productTabContent">
                                    <div className="tab-pane fade show active" id="description" role="tabpanel">
                                        <p>{product.desc}</p>
                                    </div>
                                    <div className="tab-pane fade" id="details" role="tabpanel">
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr><th style={{ width: "35%" }}>Brand</th><td><Link href={`/brand/${product.brand}`}>{brandName}</Link></td></tr>
                                                <tr><th>Category</th><td><Link href={`/category/${product.category}`}>{categoryName}</Link></td></tr>
                                                <tr><th>Manufactured by</th><td>Hallmark Enterprises</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="tab-pane fade" id="howto" role="tabpanel">
                                        <p>Use as directed on the pack. For best results, follow the instructions specific to the product type. Contact us for detailed usage guidance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="product-info">
                                <span className="badge bg-success mb-2">{categoryName}</span>
                                <h3>{product.title}</h3>

                                <div className="product-price mb-2">
                                    {priceNum > 0 ? (
                                        <>
                                            <span className="current-price" style={{ fontSize: "1.5rem" }}>₹{product.price}</span>
                                            {wasPriceNum > priceNum && <span className="old-price ms-2">₹{product.wasPrice}</span>}
                                        </>
                                    ) : (
                                        <span className="current-price" style={{ fontSize: "1.25rem" }}>Contact for Price</span>
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

                                <ul className="list-unstyled mb-4">
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Quality assured</li>
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>From Hallmark Enterprises</li>
                                </ul>

                                <div className="product-options mb-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Quantity:</label>
                                        <div className="quantity-selector d-flex align-items-center gap-2">
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                                            <input type="number" className="form-control text-center" value={quantity} readOnly style={{ width: "80px" }} />
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
                                    <Link href="/checkout" className="btn btn-outline-primary btn-lg w-100 mb-3 text-center d-block">
                                        <i className="bi bi-bag-check me-2"></i>Buy Now
                                    </Link>
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
                                    <p className="mb-0"><i className="bi bi-shield-check me-2 text-muted"></i><strong>Quality Assured</strong> — Every batch tested</p>
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
                            {relatedProducts.map((p) => (
                                <div key={p.id} className="col-6 col-lg-3 col-md-4 col-sm-6 product-item-wrapper" data-aos="fade-up">
                                    <div className="product-item">
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
                                            <img src={p.image || "/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"} alt={p.title} className="img-fluid" />
                                            <div className="product-overlay">
                                                <Link href={`/shop/product/${p.id}`} className="btn btn-sm btn-primary add-to-cart-btn">
                                                    View Product
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="product-info">
                                            <h4><Link href={`/shop/product/${p.id}`}>{p.title}</Link></h4>
                                            <p className="product-price mb-0">
                                                {p.price ? (
                                                    <>
                                                        <span className="current-price">₹{p.price}</span>
                                                        {p.wasPrice && <span className="old-price ms-2">₹{p.wasPrice}</span>}
                                                    </>
                                                ) : (
                                                    <span className="current-price">Contact for Price</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
