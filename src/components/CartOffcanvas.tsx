"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useCartWithProducts } from "@/hooks/useCartWithProducts";

export default function CartOffcanvas() {
    const router = useRouter();
    const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
    const { cartWithDetails, cartTotalFromDb, loading } = useCartWithProducts(cart);

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
                                <div key={`${item.id}-${item.packSize}`} className="cart-item d-flex align-items-center py-3 border-bottom">
                                    <div className="item-img me-3" style={{ width: "70px", height: "70px", flexShrink: 0 }}>
                                        <img 
                                            src={item.imageFromDb ? item.imageFromDb.split(',').filter(Boolean)[0] : (item.image || "/assets/img/masonry-portfolio/masonry-portfolio-1.jpg")} 
                                            alt={item.nameFromDb} 
                                            className="img-fluid rounded" 
                                            style={{ objectFit: "cover", width: "100%", height: "100%" }} 
                                        />
                                    </div>
                                    <div className="item-info flex-grow-1">
                                        {!item.available && <span className="badge bg-warning text-dark mb-1">Unavailable</span>}
                                        <h6 className="mb-0 fw-bold">{item.nameFromDb}</h6>
                                        <p className="mb-1 text-mutedSmall" style={{ fontSize: "0.8rem" }}>
                                            {item.categoryFromDb} {item.packSize && ` | ${item.packSize}`}
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="item-price fw-bold text-success">₹{item.priceFromDb}</div>
                                            <div className="quantity-control d-flex align-items-center bg-light rounded-pill border">
                                                <button
                                                    className="btn btn-sm px-2 py-0 border-0"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.packSize)}
                                                >
                                                    <i className="bi bi-dash"></i>
                                                </button>
                                                <span className="px-2" style={{ minWidth: "25px", textAlign: "center", fontSize: "0.9rem" }}>{item.quantity}</span>
                                                <button
                                                    className="btn btn-sm px-2 py-0 border-0"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.packSize)}
                                                >
                                                    <i className="bi bi-plus"></i>
                                                </button>
                                            </div>
                                            <button
                                                className="btn btn-sm text-danger border-0 p-0"
                                                onClick={() => removeFromCart(item.id, item.packSize)}
                                                title="Remove item"
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

                {cart.length > 0 && (
                    <div className="cart-footer mt-auto pt-4 border-top">
                        <div className="cart-total d-flex justify-content-between align-items-center mb-4">
                            <span className="h5 mb-0 fw-bold">Grand Total:</span>
                            <span className="h4 mb-0 fw-bold text-primary">
                                {loading ? "…" : `₹${cartTotalFromDb.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="d-grid gap-2">
                            <button onClick={() => navigateTo("/checkout")} className="btn btn-primary btn-lg">
                                <i className="bi bi-shield-check me-2"></i>Proceed to Checkout
                            </button>
                            <button onClick={() => navigateTo("/cart")} className="btn btn-outline-primary">
                                View Detailed Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
