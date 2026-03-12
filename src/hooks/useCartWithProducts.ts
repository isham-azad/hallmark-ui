"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/context/CartContext";

interface SiteProduct {
    id: string;
    title: string;
    image?: string;
    price?: string;
    categoryName?: string;
}

export interface CartItemWithDetails extends CartItem {
    nameFromDb: string;
    priceFromDb: number;
    imageFromDb?: string;
    categoryFromDb?: string;
    available: boolean;
}

export function useCartWithProducts(cart: CartItem[]) {
    const [products, setProducts] = useState<SiteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/site/products")
            .then((r) => r.json())
            .then((res) => setProducts(res.products ?? []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const parsePrice = (p?: string) => {
        if (p == null) return 0;
        return parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;
    };

    const cartWithDetails: CartItemWithDetails[] = cart.map((item) => {
        const product = products.find((p) => p.id === String(item.id));
        const available = !!product;
        return {
            ...item,
            nameFromDb: product?.title ?? item.name,
            priceFromDb: product ? parsePrice(product.price) : item.price,
            imageFromDb: product?.image,
            categoryFromDb: product?.categoryName ?? item.category,
            available,
        };
    });

    const cartTotalFromDb = cartWithDetails.reduce((sum, i) => sum + i.priceFromDb * i.quantity, 0);

    return { cartWithDetails, cartTotalFromDb, loading };
}
