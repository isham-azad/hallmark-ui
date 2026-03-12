"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { buildUpiLink } from "@/lib/upi";

interface UPIQrCodeProps {
    /** Order total amount (number, e.g. 229.10) */
    amount: number;
    /** Optional order number for display */
    orderNo?: string;
    /** QR image size in pixels */
    size?: number;
    /** Show "Scan to pay" heading */
    showHeading?: boolean;
    /** Compact layout (e.g. for inline in table) */
    compact?: boolean;
}

export default function UPIQrCode({ amount, orderNo, size = 200, showHeading = true, compact = false }: UPIQrCodeProps) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    const upiLink = buildUpiLink(amount);

    useEffect(() => {
        if (!upiLink || amount <= 0) {
            setDataUrl(null);
            setError(!process.env.NEXT_PUBLIC_UPI_ID);
            return;
        }
        setError(false);
        QRCode.toDataURL(upiLink, { width: size, margin: 2 })
            .then(setDataUrl)
            .catch(() => setDataUrl(null));
    }, [upiLink, amount, size]);

    if (!process.env.NEXT_PUBLIC_UPI_ID) {
        return (
            <div className="upi-qr-placeholder" style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", fontSize: "0.875rem", color: "#64748b" }}>
                Set NEXT_PUBLIC_UPI_ID in .env to show UPI QR.
            </div>
        );
    }

    if (error || !dataUrl) {
        return null;
    }

    return (
        <div className={`upi-qr-wrap ${compact ? "upi-qr-compact" : ""}`}>
            {showHeading && (
                <p className="upi-qr-heading" style={{ margin: "0 0 0.25rem 0", fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a" }}>
                    Scan to pay via UPI
                    {amount > 0 && (
                        <span className="upi-qr-amount" style={{ color: "#16a34a", marginLeft: "0.25rem" }}> ₹{amount.toFixed(2)}</span>
                    )}
                </p>
            )}
            {orderNo && <p className="upi-qr-order" style={{ margin: "0 0 0.5rem 0", fontSize: "0.8125rem", color: "#64748b" }}>Order {orderNo}</p>}
            <img src={dataUrl} alt="UPI QR Code" className="upi-qr-img" width={size} height={size} style={{ display: "block" }} />
        </div>
    );
}
