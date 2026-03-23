"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/context/CartContext";

interface SiteProduct {
    id: string;
    title: string;
    image?: string;
    price?: string;
    categoryName?: string;
    b2bPricingTiers?: { minQty: number; price: string }[];
}

export interface CartItemWithDetails extends CartItem {
    nameFromDb: string;
    priceFromDb: number;
    imageFromDb?: string;
    categoryFromDb?: string;
    available: boolean;
    originalPriceFromDb: number;
}

export function useCartWithProducts(cart: CartItem[]) {
    const [products, setProducts] = useState<SiteProduct[]>([]);
    const [isB2B, setIsB2B] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/site/products").then((r) => r.json()),
            fetch("/api/b2b/me").then((r) => r.json()).catch(() => ({ authenticated: false }))
        ])
            .then(([productsRes, b2bRes]) => {
                setProducts(productsRes.products ?? []);
                setIsB2B(b2bRes.authenticated ?? false);
            })
            .catch(() => {
                setProducts([]);
                setIsB2B(false);
            })
            .finally(() => setLoading(false));
    }, []);

    const parsePrice = (p?: string) => {
        if (p == null) return 0;
        return parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;
    };

    const cartWithDetails: CartItemWithDetails[] = cart.map((item) => {
        const product = products.find((p) => p.id === String(item.id));
        const available = !!product;
        const originalPriceFromDb = product ? parsePrice(product.price) : item.price;
        let finalPrice = originalPriceFromDb;

        if (isB2B && product && product.b2bPricingTiers && product.b2bPricingTiers.length > 0) {
            const sortedTiers = [...product.b2bPricingTiers].sort((a, b) => b.minQty - a.minQty);
            const appliedTier = sortedTiers.find(t => item.quantity >= t.minQty);
            if (appliedTier) {
                finalPrice = parsePrice(appliedTier.price);
            }
        }

        return {
            ...item,
            nameFromDb: product?.title ?? item.name,
            priceFromDb: finalPrice,
            imageFromDb: product?.image,
            categoryFromDb: product?.categoryName ?? item.category,
            available,
            originalPriceFromDb,
        };
    });

    const cartTotalFromDb = cartWithDetails.reduce((sum, i) => sum + i.priceFromDb * i.quantity, 0);
    const totalSavings = cartWithDetails.reduce((sum, i) => sum + Math.max(0, (i.originalPriceFromDb - i.priceFromDb) * i.quantity), 0);

    return { cartWithDetails, cartTotalFromDb, totalSavings, loading, isB2B };
}

