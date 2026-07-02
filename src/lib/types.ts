export interface SiteProduct {
    id: string;
    title: string;
    desc: string;
    image?: string;
    price?: string;
    wasPrice?: string;
    category: string;
    brand: string;
    categoryName: string;
    brandName: string;
    howToUse: string;
    b2bPricingTiers: B2BPricingTier[];
    updatedAt: number;
}

export interface B2BPricingTier {
    minQty: number;
    price: string;
}

export interface SiteBrand {
    id: string;
    name: string;
    shortDesc: string;
    summary: string;
    image: string;
}

export interface SiteCategory {
    id: string;
    name: string;
    summary: string;
    image: string;
}

export interface OrderItem {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
    image?: string | null;
    createdAt: string;
}

export interface Order {
    id: string;
    orderNo: string;
    customer: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    shippingName?: string | null;
    shippingAddress?: string | null;
    date: string;
    total: string;
    status: string;
    payment: string;
    paymentMethod?: string;
    paymentStatus?: string;
    rewardsUsed?: number;
    rewardsEarned?: number;
    voucherAmount?: number;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

export interface SiteTestimonial {
    id: string;
    name: string;
    role: string;
    quote: string;
    rating: number;
    createdAt: number;
}
