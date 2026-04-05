"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

const relatedProducts = [
    {
        id: 1,
        name: "Soph Dishwash Cake",
        category: "Home Care",
        price: 10,
        oldPrice: 15,
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566377/hallmark/assets/img/masonry-portfolio/masonry-portfolio-2.jpg",
    },
    {
        id: 2,
        name: "Emitol Floor Cleaner",
        category: "Cleaning Liquids",
        price: 89,
        oldPrice: 109,
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566380/hallmark/assets/img/masonry-portfolio/masonry-portfolio-4.jpg",
    },
    {
        id: 3,
        name: "Soph Handwash Aloe Vera",
        category: "Personal Care",
        price: 65,
        oldPrice: 79,
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg",
    },
    {
        id: 4,
        name: "Fabritt Fabric Softener",
        category: "Fabric Care",
        price: 95,
        oldPrice: 115,
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566385/hallmark/assets/img/masonry-portfolio/masonry-portfolio-9.jpg",
    },
];

const mainProduct = {
    id: 101, // Custom ID for the featured product
    name: "Soph Dishwash Liquid",
    category: "Home Care",
    price: 85,
    oldPrice: 99,
    image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg",
};

export default function ProductDetailsStaticClient() {
    const router = useRouter();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedPack, setSelectedPack] = useState("500ml");
    const [pincode, setPincode] = useState("");
    const [pincodeStatus, setPincodeStatus] = useState<"none" | "available" | "unavailable" | "checking">("none");

    const handleBuyNow = () => {
        addToCart(mainProduct, quantity, selectedPack, false);
        router.push("/checkout");
    };

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
    }, []);

    return (
        <>
            {/* Page Title */}
            <div className="page-title mt-5" data-aos="fade">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>Soph Dishwash Liquid</h1>
                                <p className="mb-0">Powerful grease-cutting action with refreshing fragrances for a hygienically clean kitchen.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/shop">Shop</Link></li>
                            <li className="current">Soph Dishwash Liquid</li>
                        </ol>
                    </div>
                </nav>
            </div>

            {/* Product Details Section */}
            <section id="product-details" className="product-details section">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    <div className="row gy-4">
                        {/* Product Image */}
                        <div className="col-lg-8">
                            <div className="product-details-slider swiper init-swiper">
                                <div className="swiper-wrapper align-items-center">
                                    <div className="swiper-slide">
                                        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg" alt="Soph Dishwash Liquid" className="img-fluid" />
                                    </div>
                                    <div className="swiper-slide">
                                        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566377/hallmark/assets/img/masonry-portfolio/masonry-portfolio-2.jpg" alt="Soph Dishwash Liquid – Variant" className="img-fluid" />
                                    </div>
                                    <div className="swiper-slide">
                                        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566379/hallmark/assets/img/masonry-portfolio/masonry-portfolio-3.jpg" alt="Soph Dishwash Liquid – In Use" className="img-fluid" />
                                    </div>
                                </div>
                                <div className="swiper-pagination"></div>
                            </div>

                            {/* Product Description Tabs */}
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
                                        <p>
                                            Soph Dishwash Liquid delivers <strong>powerful grease-cutting and stain removal</strong> with refreshing fragrances including <strong>Lime, Orange, and Green Apple</strong>. Its effective formula helps kill germs, leaving utensils spotless, shiny, and hygienically clean.
                                        </p>
                                        <p>
                                            Available in 250 ml, 500 ml, and 1-liter packs, Soph Dishwash Liquid is designed for everyday kitchen use. It cuts through the toughest grease quickly, requiring only a small amount to clean a full load of dishes—making it economical and effective at the same time.
                                        </p>
                                        <p>
                                            Choose Soph for a fresher, safer kitchen every day.
                                        </p>
                                    </div>
                                    <div className="tab-pane fade" id="details" role="tabpanel">
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr><th style={{ width: "35%" }}>Brand</th><td>Soph</td></tr>
                                                <tr><th>Category</th><td>Home Care</td></tr>
                                                <tr><th>Available Sizes</th><td>250 ml, 500 ml, 1 Litre</td></tr>
                                                <tr><th>Fragrances</th><td>Lime, Orange, Green Apple</td></tr>
                                                <tr><th>Key Feature</th><td>Kills germs, cuts grease, leaves utensils shiny</td></tr>
                                                <tr><th>Item Weight</th><td>600 Grams</td></tr>
                                                <tr><th>Item Dimensions</th><td>8 x 10 x 18 Centimeters</td></tr>
                                                <tr><th>Scent</th><td>Aloe Vera</td></tr>
                                                <tr><th>Skin Type</th><td>All</td></tr>
                                                <tr><th>Item Package Quantity</th><td>2</td></tr>
                                                <tr><th>Product Benefits</th><td>Anti bacterial</td></tr>
                                                <tr><th>Special Feature</th><td>Nourishing</td></tr>
                                                <tr><th>Item Form</th><td>Liquid</td></tr>
                                                <tr><th>Number of Items</th><td>2</td></tr>
                                                <tr><th>Manufactured by</th><td>Hallmark Enterprises</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="tab-pane fade" id="howto" role="tabpanel">
                                        <ol>
                                            <li className="mb-2">Apply a small amount of Soph Dishwash Liquid directly onto a wet sponge or dishcloth.</li>
                                            <li className="mb-2">Scrub the utensils gently to work up a rich lather that cuts through grease and food residue.</li>
                                            <li className="mb-2">Rinse thoroughly with clean water to remove all soap residue.</li>
                                            <li className="mb-2">For heavily soiled items, soak for 5–10 minutes before scrubbing.</li>
                                            <li>Enjoy clean, shiny, hygienically safe utensils every time.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Info Sidebar */}
                        <div className="col-lg-4">
                            <div className="product-info">
                                <span className="badge bg-success mb-2">Home Care</span>
                                <h3>Soph Dishwash Liquid</h3>

                                <div className="product-price mb-2">
                                    <span className="current-price" style={{ fontSize: "1.5rem" }}>₹85</span>
                                    <span className="old-price ms-2">₹99</span>
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

                                <p className="product-description">
                                    Powerful grease-cutting and stain removal with refreshing lime, orange, and green apple fragrances. Kills germs, leaving utensils spotless, shiny, and hygienically clean.
                                </p>

                                {/* Highlights */}
                                <ul className="list-unstyled mb-4">
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Kills 99.9% of germs</li>
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Powerful grease-cutting action</li>
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Refreshing long-lasting fragrance</li>
                                    <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Economical — a little goes a long way</li>
                                </ul>

                                {/* Pack Size Selector */}
                                <div className="product-options mb-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Pack Size:</label>
                                        <div className="btn-group d-flex flex-wrap gap-2" role="group">
                                            {["250ml", "500ml", "1 Litre"].map((size) => (
                                                <div key={size}>
                                                    <input
                                                        type="radio"
                                                        className="btn-check"
                                                        name="packSize"
                                                        id={`pack-${size}`}
                                                        checked={selectedPack === size}
                                                        onChange={() => setSelectedPack(size)}
                                                    />
                                                    <label className="btn btn-outline-primary" htmlFor={`pack-${size}`}>{size}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Quantity:</label>
                                        <div className="quantity-selector d-flex align-items-center gap-2">
                                            <button className="btn btn-outline-secondary" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                                            <input type="number" className="form-control text-center" value={quantity} readOnly style={{ width: "80px" }} />
                                            <button className="btn btn-outline-secondary" onClick={() => setQuantity(q => Math.min(10, q + 1))}>+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="product-actions">
                                    <button
                                        className="btn btn-primary btn-lg w-100 mb-2"
                                        onClick={() => addToCart(mainProduct, quantity, selectedPack)}
                                    >
                                        <i className="bi bi-cart-plus me-2"></i>Add to Cart
                                    </button>
                                    <button 
                                        onClick={handleBuyNow}
                                        className="btn btn-outline-primary btn-lg w-100 mb-3 text-center"
                                    >
                                        <i className="bi bi-bag-check me-2"></i>Buy Now
                                    </button>
                                </div>

                                {/* Pincode Checker */}
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

                                {/* Brand Info */}
                                <div className="mt-4 pt-4 border-top">
                                    <p className="mb-1"><i className="bi bi-building me-2 text-muted"></i><strong>Sold by:</strong> Hallmark Enterprises</p>
                                    <p className="mb-1"><i className="bi bi-tag me-2 text-muted"></i><strong>Brand:</strong> Soph</p>
                                    <p className="mb-0"><i className="bi bi-shield-check me-2 text-muted"></i><strong>Quality Assured</strong> — Every batch tested</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* You May Also Like */}
            <section className="shop section pt-0">
                <div className="container">
                    <div className="row mb-4">
                        <div className="col-12">
                            <h3 className="mb-0">You May Also Like</h3>
                        </div>
                    </div>
                    <div className="row gy-4">
                        {relatedProducts.map((product) => (
                            <div key={product.id} className="col-6 col-lg-3 col-md-4 col-sm-6 product-item-wrapper" data-aos="fade-up">
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
                                            {product.category}
                                        </span>
                                        <img src={product.image} alt={product.name} className="img-fluid" />
                                        <div className="product-overlay">
                                            <button
                                                className="btn btn-sm btn-primary add-to-cart-btn"
                                                onClick={() => addToCart(product, 1)}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <h4><Link href="/product-details">{product.name}</Link></h4>
                                        <p className="product-price mb-0">
                                            <span className="current-price">₹{product.price}</span>
                                            <span className="old-price ms-2">₹{product.oldPrice}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
