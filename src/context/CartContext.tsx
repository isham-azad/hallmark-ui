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
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity: number, packSize?: string) => void;
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

    const addToCart = (product: any, quantity: number, packSize?: string) => {
        setCart((prevCart) => {
            const existingItemIndex = prevCart.findIndex(
                (item) => item.id === product.id && item.packSize === packSize
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            }

            return [
                ...prevCart,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    quantity: quantity,
                    packSize: packSize,
                },
            ];
        });

        // Auto open cart when item added
        setIsCartOpen(true);
    };

    const removeFromCart = (id: number | string, packSize?: string) => {
        setCart((prevCart) =>
            prevCart.filter((item) => !(item.id === id && item.packSize === packSize))
        );
    };

    const updateQuantity = (id: number | string, quantity: number, packSize?: string) => {
        if (quantity <= 0) {
            removeFromCart(id, packSize);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === id && item.packSize === packSize
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
