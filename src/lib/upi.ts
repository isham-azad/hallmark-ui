/**
 * Parse amount from order total string (e.g. "₹229.10" or "229.10").
 */
export function parseOrderTotal(totalStr: string | undefined): number {
    if (totalStr == null || totalStr === "" || totalStr === "—") return 0;
    const num = parseFloat(String(totalStr).replace(/[^\d.]/g, ""));
    return Number.isFinite(num) ? num : 0;
}

/**
 * Build base UPI parameters.
 * Using a more robust parameter set for better app compatibility.
 */
function buildBaseUpiParams(amount: number, orderNo?: string): string | null {
    const pa = process.env.NEXT_PUBLIC_UPI_ID?.trim();
    const pn = process.env.NEXT_PUBLIC_UPI_BUSINESS_NAME?.trim() || "Hallmark Enterprises";
    const am = amount > 0 ? amount.toFixed(2) : "";
    const ref = orderNo ? orderNo.replace(/^#/, "").trim() : "";
    const note = ref ? `Order ${ref}` : "Payment";
    const mc = "0000"; // Generic Merchant Category Code

    if (!pa) return null;

    const params = [
        `pa=${encodeURIComponent(pa)}`,
        `pn=${encodeURIComponent(pn)}`,
        `am=${encodeURIComponent(am)}`,
        `cu=INR`,
        `mc=${encodeURIComponent(mc)}`,
        `mode=02`,
        `tn=${encodeURIComponent(note)}`,
        `tr=${encodeURIComponent(ref)}`
    ];

    return params.join("&");
}

/**
 * Build UPI deep link for payment.
 */
export function buildUpiLink(amount: number, orderNo?: string): string | null {
    const params = buildBaseUpiParams(amount, orderNo);
    return params ? `upi://pay?${params}` : null;
}

/**
 * Build Google Pay (GPay) deep link.
 */
export function buildGPayLink(amount: number, orderNo?: string, os: "android" | "ios" | "unknown" = "unknown"): string | null {
    const params = buildBaseUpiParams(amount, orderNo);
    if (!params) return null;

    if (os === "android") {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    } else if (os === "ios") {
        // GPay on iOS uses 'gpay://upi/pay?'
        return `gpay://upi/pay?${params}`;
    }
    return `upi://pay?${params}`;
}

/**
 * Build PhonePe deep link.
 */
export function buildPhonePeLink(amount: number, orderNo?: string, os: "android" | "ios" | "unknown" = "unknown"): string | null {
    const params = buildBaseUpiParams(amount, orderNo);
    if (!params) return null;

    if (os === "android") {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`;
    } else if (os === "ios") {
        return `phonepe://pay?${params}`;
    }
    return `upi://pay?${params}`;
}

/**
 * Build Paytm deep link.
 */
export function buildPaytmLink(amount: number, orderNo?: string, os: "android" | "ios" | "unknown" = "unknown"): string | null {
    const params = buildBaseUpiParams(amount, orderNo);
    if (!params) return null;

    if (os === "android") {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end`;
    } else if (os === "ios") {
        return `paytmmp://pay?${params}`;
    }
    return `upi://pay?${params}`;
}

