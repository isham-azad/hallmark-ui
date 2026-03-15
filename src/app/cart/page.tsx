"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCartWithProducts } from "@/hooks/useCartWithProducts";
import { ShimmerBox } from "@/components/Shimmer";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();
    const { cartWithDetails, cartTotalFromDb, loading } = useCartWithProducts(cart);

    const shipping = 0;
    const subtotal = loading ? 0 : cartTotalFromDb;
    const total = subtotal;

    return (
        <>
            <div className="page-title mt-5" data-aos="fade">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>Shopping Cart</h1>
                                <p className="mb-0">Review your items before checkout</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/shop">Shop</Link></li>
                            <li className="current">Cart</li>
                        </ol>
                    </div>
                </nav>
            </div>

            <section id="cart" className="cart section">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="cart-items-list">
                                <div className="cart-header d-flex justify-content-between align-items-center mb-4">
                                    <h3>Items in your cart</h3>
                                    <span className="cart-count badge bg-primary rounded-pill">{cart.length} items</span>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="cart-empty text-center py-5 shadow-sm rounded border">
                                        <i className="bi bi-cart-x text-muted" style={{ fontSize: "64px", opacity: 0.3 }}></i>
                                        <h4 className="mt-3">Your cart is empty</h4>
                                        <p className="text-muted">Looks like you haven't added any items to your cart yet.</p>
                                        <Link href="/shop" className="btn btn-primary mt-3 px-4">Continue Shopping</Link>
                                    </div>
                                ) : loading ? (
                                    <div className="cart-items-container">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="cart-item-card mb-3 p-3 border rounded shadow-sm bg-white">
                                                <div className="row align-items-center">
                                                    <div className="col-3 col-md-2">
                                                        <ShimmerBox style={{ width: "100%", aspectRatio: "1", borderRadius: 8 }} />
                                                    </div>
                                                    <div className="col-9 col-md-4">
                                                        <ShimmerBox style={{ height: 20, width: "80%", marginBottom: 8 }} />
                                                        <ShimmerBox style={{ height: 14, width: "50%" }} />
                                                    </div>
                                                    <div className="col-6 col-md-2 mt-3 mt-md-0">
                                                        <ShimmerBox style={{ height: 36, width: 100 }} />
                                                    </div>
                                                    <div className="col-4 col-md-2 mt-3 mt-md-0">
                                                        <ShimmerBox style={{ height: 24, width: 60 }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="cart-items-container">
                                        {cartWithDetails.map((item) => (
                                            <div key={`${item.id}-${item.packSize}`} className="cart-item-card mb-3 p-3 border rounded shadow-sm bg-white">
                                                {!item.available && (
                                                    <div className="badge bg-warning text-dark mb-2">No longer available</div>
                                                )}
                                                <div className="row align-items-center">
                                                    <div className="col-3 col-md-2">
                                                        <img 
                                                            src={item.imageFromDb ? item.imageFromDb.split(',').filter(Boolean)[0] : (item.image || "/assets/img/masonry-portfolio/masonry-portfolio-1.jpg")} 
                                                            alt={item.nameFromDb} 
                                                            className="img-fluid rounded border" 
                                                        />
                                                    </div>
                                                    <div className="col-9 col-md-4">
                                                        <h5 className="mb-1 fw-bold">{item.nameFromDb}</h5>
                                                        <p className="text-muted mb-0 small">
                                                            {item.categoryFromDb} {item.packSize && ` | ${item.packSize}`}
                                                        </p>
                                                    </div>
                                                    <div className="col-6 col-md-2 mt-3 mt-md-0">
                                                        <div className="quantity-selector d-flex align-items-center gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary rounded-circle"
                                                                style={{ width: "28px", height: "28px", padding: 0 }}
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.packSize)}
                                                            >-</button>
                                                            <span className="fw-bold px-1">{item.quantity}</span>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary rounded-circle"
                                                                style={{ width: "28px", height: "28px", padding: 0 }}
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.packSize)}
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 col-md-2 text-md-center mt-3 mt-md-0 text-success fw-bold h5 mb-0">
                                                        ₹{item.priceFromDb * item.quantity}
                                                    </div>
                                                    <div className="col-2 col-md-2 text-end mt-3 mt-md-0">
                                                        <button
                                                            className="btn btn-sm btn-light text-danger border"
                                                            onClick={() => removeFromCart(item.id, item.packSize)}
                                                            title="Remove Item"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="cart-summary p-4 border rounded shadow-sm bg-light">
                                <h4 className="mb-4 fw-bold">Order Summary</h4>
                                <div className="summary-item d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span className="fw-bold">{loading ? "—" : `₹${subtotal.toFixed(2)}`}</span>
                                </div>

                                <hr />
                                <div className="summary-total d-flex justify-content-between mb-4 mt-3">
                                    <span className="h5 fw-bold mb-0">Total:</span>
                                    <span className="text-primary h4 fw-bold mb-0">₹{total.toFixed(2)}</span>
                                </div>

                                {cart.length > 0 && (
                                    <Link href="/checkout" className="btn btn-primary btn-lg w-100 mb-3 text-center fw-bold shadow-sm">
                                        <i className="bi bi-credit-card me-2"></i>Proceed to Checkout
                                    </Link>
                                )}
                                <Link href="/shop" className="btn btn-outline-secondary w-100 text-center">
                                    <i className="bi bi-arrow-left me-2"></i>Continue Shopping
                                </Link>

                                <div className="mt-4 p-3 border border-success rounded text-success" style={{ backgroundColor: "#f0fff4", fontSize: "0.85rem" }}>
                                    <i className="bi bi-shield-check me-2"></i> Secure Checkout Guaranteed
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
