"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useCartWithProducts } from "@/hooks/useCartWithProducts";

export default function CartOffcanvas() {
    const router = useRouter();
    const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
    const { cartWithDetails, cartTotalFromDb, totalSavings, loading, isB2B } = useCartWithProducts(cart);

    const offcanvasRef = useRef<HTMLDivElement>(null);

    const navigateTo = (path: string) => {
        setIsCartOpen(false);
        // Small timeout to allow offcanvas to start closing animation
        setTimeout(() => {
            router.push(path);
        }, 150);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const bootstrap = (window as any).bootstrap;
            const element = offcanvasRef.current;
            if (element && bootstrap) {
                const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(element);
                if (isCartOpen) {
                    offcanvas.show();
                } else {
                    offcanvas.hide();
                }

                const handleHidden = () => setIsCartOpen(false);
                element.addEventListener("hidden.bs.offcanvas", handleHidden);
                return () => element.removeEventListener("hidden.bs.offcanvas", handleHidden);
            }
        }
    }, [isCartOpen, setIsCartOpen]);

    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex={-1}
            id="cartOffcanvas"
            ref={offcanvasRef}
            aria-labelledby="cartOffcanvasLabel"
        >
            <div className="offcanvas-header bg-light">
                <h5 className="offcanvas-title fw-bold" id="cartOffcanvasLabel">
                    <i className="bi bi-cart3 me-2"></i>Your Shopping Cart
                </h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsCartOpen(false)}></button>
            </div>
            <div className="offcanvas-body d-flex flex-column">
                <div className="cart-items flex-grow-1 overflow-auto">
                    {cart.length === 0 ? (
                        <div className="cart-empty text-center py-5">
                            <i className="bi bi-cart-x text-muted" style={{ fontSize: "64px", opacity: 0.3 }}></i>
                            <p className="mt-3 text-muted">Your cart is empty</p>
                            <button onClick={() => navigateTo("/shop")} className="btn btn-outline-primary mt-3">
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="cart-list">
                             {cartWithDetails.map((item) => (
                                <div key={`${item.id}-${item.packSize}`} className="cart-item d-flex flex-column p-0 border rounded-3 mb-3 bg-white shadow-sm overflow-hidden">
                                    <div className="d-flex p-3 pb-2">
                                        <div className="item-img flex-shrink-0 border rounded" style={{ width: "85px", height: "85px", backgroundColor: "#fff", padding: "2px" }}>
                                                <img
                                                    src={item.imageFromDb ? item.imageFromDb.split(',').filter(Boolean)[0] : (item.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg")}
                                                    alt={item.nameFromDb}
                                                    className="img-fluid rounded"
                                                    style={{ objectFit: "contain", width: "100%", height: "100%" }}
                                                />
                                        </div>
                                        <div className="item-info flex-grow-1 ms-2">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    {!item.available && <span className="badge bg-warning text-dark mb-1" style={{ fontSize: '0.65rem' }}>Unavailable</span>}
                                                    <h6 className="mb-0 fw-bold" style={{ fontSize: "0.95rem", color: "#1e293b", lineHeight: '1.4' }}>{item.nameFromDb}</h6>
                                                    <div className="mb-1 d-flex flex-wrap gap-1">
                                                        <span className="badge rounded-pill bg-light text-secondary border" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                                                            {item.categoryFromDb}
                                                        </span>
                                                        {item.packSize && item.packSize.toLowerCase() !== "standard" && (
                                                            <span className="badge rounded-pill bg-light text-secondary border" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                                                                {item.packSize}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm text-danger border-0 p-1 opacity-50 hover-opacity-100"
                                                    onClick={() => removeFromCart(item.id, item.packSize)}
                                                    title="Remove item"
                                                >
                                                    <i className="bi bi-trash3" style={{ fontSize: '1.1rem' }}></i>
                                                </button>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-end mt-2">
                                                <div className="item-price">
                                                    {item.originalPriceFromDb > item.priceFromDb && (
                                                        <del className="text-muted d-block" style={{fontSize: "0.72rem", marginBottom: '-4px'}}>₹{item.originalPriceFromDb}</del>
                                                    )}
                                                    <span className="fw-bold" style={{ fontSize: "1.05rem", color: "#10b981" }}>₹{item.priceFromDb}</span>
                                                </div>

                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="quantity-control d-flex align-items-center bg-light rounded-pill border" style={{ padding: "1px" }}>
                                                        <button
                                                            className="btn btn-sm px-2 py-0 border-0 text-muted"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.packSize)}
                                                            disabled={item.quantity <= 1}
                                                            style={{ opacity: item.quantity <= 1 ? 0.3 : 1, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}
                                                        >
                                                            <i className="bi bi-dash-lg" style={{ fontSize: '0.7rem' }}></i>
                                                        </button>
                                                        <span className="px-2 fw-bold" style={{ minWidth: "22px", textAlign: "center", fontSize: "0.85rem", color: '#1e293b' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="btn btn-sm px-2 py-0 border-0 text-muted"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.packSize)}
                                                        >
                                                            <i className="bi bi-plus-lg" style={{ fontSize: '0.7rem' }}></i>
                                                        </button>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="text-muted" style={{ fontSize: "0.55rem", textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Total</div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: "0.9rem" }}>₹{(item.priceFromDb * item.quantity).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {item.originalPriceFromDb > item.priceFromDb && (
                                        <div className="bg-light border-top p-2 px-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)' }}>
                                            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {isB2B ? "MRP Profit for these units" : "Savings for these units"}
                                            </span>
                                            <span className="text-success fw-bold" style={{ fontSize: '0.85rem' }}>
                                                ₹{((item.originalPriceFromDb - item.priceFromDb) * item.quantity).toFixed(2)} ({Math.round(((item.originalPriceFromDb - item.priceFromDb) / item.originalPriceFromDb) * 100)}% {isB2B ? "Profit" : "Off"})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer mt-auto pt-4 border-top">
                        <div className="cart-total d-flex justify-content-between align-items-center mb-4">
                            <span className="h5 mb-0 fw-bold">Grand Total:</span>
                            <div className="text-end">
                                {totalSavings > 0 && (
                                    <div className="text-success small fw-bold mb-1" style={{fontSize: "0.85rem"}}>
                                        {isB2B ? "MRP Profit:" : "Savings:"} ₹{totalSavings.toFixed(2)} ({Math.round((totalSavings / (cartTotalFromDb + totalSavings)) * 100)}%)
                                    </div>
                                )}
                                <span className="h4 mb-0 fw-bold text-primary">
                                    {loading ? "…" : `₹${cartTotalFromDb.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div className="d-grid gap-2">
                             <button onClick={() => setIsCartOpen(false)} className="btn btn-primary btn-lg py-2" style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                                 <i className="bi bi-arrow-left me-2"></i>Continue Shopping
                             </button>
                             <div className="row g-2 mt-0">
                                <div className="col-6">
                                    <button onClick={() => navigateTo("/cart")} className="btn btn-outline-primary w-100 py-2" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                        View Cart
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button onClick={() => navigateTo("/checkout")} className="btn btn-primary w-100 py-2" style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                                        Checkout
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
