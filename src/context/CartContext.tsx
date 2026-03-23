"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
    id: number | string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    quantity: number;
    packSize?: string;
    sku?: string;
    brandName?: string;
    howToUse?: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity: number, packSize?: string, openCart?: boolean) => void;
    removeFromCart: (id: number | string, packSize?: string) => void;
    updateQuantity: (id: number | string, quantity: number, packSize?: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("hallmark-cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem("hallmark-cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any, quantity: number, packSize?: string, openCart: boolean = true) => {
        const normalizedPack = packSize || "Standard";
        const qToAdd = Number(quantity) || 1;

        setCart((prevCart) => {
            const existingItemIndex = prevCart.findIndex(
                (item: any) => item.id === product.id && (item.packSize || "Standard") === normalizedPack
            );

            if (existingItemIndex > -1) {
                return prevCart.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: (Number(item.quantity) || 0) + qToAdd }
                        : item
                );
            }

            // Assuming product object passed to addToCart has these properties
            // If product.title, priceNum, imageUrl, categoryName are not directly available on 'product',
            // they would need to be derived or passed in.
            // For now, mapping them from the 'product' object as per the instruction's snippet.
            const cartProduct = {
                id: product.id,
                name: product.title || product.name, // Use title if available, else name
                price: product.price, // Assuming price is directly on product
                image: product.image, // Assuming image is directly on product
                category: product.category, // Assuming category is directly on product
                sku: product.sku || "",
                brandName: product.brandName,
                howToUse: product.howToUse,
            };

            return [
                ...prevCart,
                {
                    ...cartProduct,
                    quantity: qToAdd,
                    packSize: normalizedPack,
                },
            ];
        });

        // Auto open cart when item added (unless suppressed)
        if (openCart) {
            setIsCartOpen(true);
        }
    };

    const removeFromCart = (id: number | string, packSize?: string) => {
        const normalizedPack = packSize || "Standard";
        setCart((prevCart) =>
            prevCart.filter((item) => !(item.id === id && (item.packSize || "Standard") === normalizedPack))
        );
    };

    const updateQuantity = (id: number | string, quantity: number, packSize?: string) => {
        const normalizedPack = packSize || "Standard";
        if (quantity <= 0) {
            removeFromCart(id, normalizedPack);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === id && (item.packSize || "Standard") === normalizedPack
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                isCartOpen,
                setIsCartOpen,
                toggleCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
