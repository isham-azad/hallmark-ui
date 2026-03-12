/**
 * Parse amount from order total string (e.g. "₹229.10" or "229.10").
 */
export function parseOrderTotal(totalStr: string | undefined): number {
    if (totalStr == null || totalStr === "" || totalStr === "—") return 0;
    const num = parseFloat(String(totalStr).replace(/[^\d.]/g, ""));
    return Number.isFinite(num) ? num : 0;
}

/**
 * Build UPI deep link for payment.
 * Uses NEXT_PUBLIC_UPI_ID and NEXT_PUBLIC_UPI_BUSINESS_NAME from env.
 */
export function buildUpiLink(amount: number): string | null {
    const pa = process.env.NEXT_PUBLIC_UPI_ID?.trim();
    const pn = process.env.NEXT_PUBLIC_UPI_BUSINESS_NAME?.trim() || "Merchant";
    if (!pa) return null;
    const am = amount > 0 ? amount.toFixed(2) : "0";
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR`;
}
