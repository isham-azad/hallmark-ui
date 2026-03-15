"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import UPIQrCode from "@/components/UPIQrCode";
import { parseOrderTotal } from "@/lib/upi";

interface OrderItemType {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
}

interface OrderType {
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
    date: Date | string;
    total: string;
    status: string;
    payment: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: OrderItemType[];
}

interface InvoiceViewProps {
    order: OrderType;
}

export default function InvoiceView({ order }: InvoiceViewProps) {
    const orderDate = order.date instanceof Date ? order.date : new Date(order.date);

    useEffect(() => {
        const originalTitle = document.title;
        document.title = `Invoice_${order.orderNo}`;
        return () => {
            document.title = originalTitle;
        };
    }, [order.orderNo]);

    const handlePrint = () => window.print();

    return (
        <div className="invoice-page">
            <div className="invoice-actions no-print">
                <Link href={`/admin/orders/${order.id}`} className="invoice-back">
                    <i className="bi bi-arrow-left"></i>
                    Back to Order
                </Link>
                <button type="button" className="invoice-print-btn" onClick={handlePrint}>
                    <i className="bi bi-printer"></i>
                    Print / Save as PDF
                </button>
            </div>

            <div className="invoice-paper">
                <header className="invoice-header">
                    <div className="invoice-header-content">
                        <h1 className="invoice-title">INVOICE</h1>
                        <p className="invoice-order-no">{order.orderNo}</p>
                    </div>
                    <div className="invoice-logo">
                        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png" alt="Logo" className="invoice-logo-img" />
                    </div>
                </header>

                <div className="invoice-meta">
                    <div className="invoice-meta-block invoice-meta-item">
                        <span className="invoice-meta-label">Order Date</span>
                        <span className="invoice-meta-value">{format(orderDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="invoice-meta-block invoice-meta-item">
                        <span className="invoice-meta-label">Customer</span>
                        <span className="invoice-meta-value">{order.customer}</span>
                    </div>
                    <div className="invoice-meta-block invoice-meta-item">
                        <span className="invoice-meta-label">Email</span>
                        <span className="invoice-meta-value invoice-email-value">{order.email}</span>
                    </div>
                    {order.phone && (
                        <div className="invoice-meta-block invoice-meta-item">
                            <span className="invoice-meta-label">Phone</span>
                            <span className="invoice-meta-value">{order.phone}</span>
                        </div>
                    )}
                    <div className="invoice-meta-row">
                        {(order.address || order.city || order.zip) && (
                            <div className="invoice-meta-block invoice-meta-address invoice-meta-full">
                                <span className="invoice-meta-label">Billing Address</span>
                                <span className="invoice-meta-value">{[order.address, order.city, order.zip].filter(Boolean).join(", ")}</span>
                            </div>
                        )}
                        {order.shippingAddress && (order.shippingAddress !== order.address || order.shippingName) && (
                            <div className="invoice-meta-block invoice-meta-address invoice-meta-full">
                                <span className="invoice-meta-label">Shipping Address</span>
                                <span className="invoice-meta-value">
                                    {order.shippingName && <div className="fw-bold">{order.shippingName}</div>}
                                    {order.shippingAddress}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="invoice-meta-block invoice-meta-item">
                        <span className="invoice-meta-label">Payment Method</span>
                        <span className="invoice-meta-value">{order.paymentMethod ?? order.payment ?? "—"}</span>
                    </div>
                    <div className="invoice-meta-block invoice-meta-item">
                        <span className="invoice-meta-label">Payment Status</span>
                        <span className="invoice-meta-value">{order.paymentStatus ?? "Pending"}</span>
                    </div>
                </div>



                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th className="th-product">Product</th>
                            <th className="th-sku">SKU</th>
                            <th className="th-qty">Qty</th>
                            <th className="th-price">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td className="td-product">
                                    <div className="product-info">
                                        <div className="product-name">{item.name}</div>
                                        <div className="product-sku mobile-only-sku">{item.sku || "—"}</div>
                                    </div>
                                </td>
                                <td className="td-sku">{item.sku || "—"}</td>
                                <td className="td-qty">{item.qty}</td>
                                <td className="td-price">{item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="invoice-summary">
                    <div className="invoice-summary-row total">
                        <span className="summary-label">Total Amount</span>
                        <span className="summary-value">{order.total}</span>
                    </div>
                </div>

                <div className="invoice-footer">
                    {(order.paymentMethod === "UPI" || order.payment === "UPI") && parseOrderTotal(order.total) > 0 && (
                        <div className="invoice-qr-footer">
                            <div className="qr-box">
                                <UPIQrCode amount={parseOrderTotal(order.total)} orderNo={order.orderNo} size={160} showHeading />
                                <p className="qr-hint">Scan to Pay via UPI</p>
                            </div>
                        </div>
                    )}
                    <p className="thank-you">Thank you for your order.</p>
                </div>
            </div>

            <style jsx>{`
                .invoice-page { padding: 2rem; max-width: 800px; margin: 0 auto; }
                .invoice-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
                .invoice-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; font-weight: 600; text-decoration: none; }
                .invoice-back:hover { color: #0f172a; }
                .invoice-print-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #ffc451; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
                .invoice-print-btn:hover { background: #f8b42d; }
                .invoice-paper { background: #fff; padding: 2.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
                .invoice-header { border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
                .invoice-logo-img { height: 48px; width: auto; filter: brightness(0); display: block; }
                .invoice-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; letter-spacing: 0.05em; }
                .invoice-order-no { font-size: 0.875rem; color: #64748b; margin: 0; font-weight: 500; }
                .invoice-meta { display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; margin-bottom: 1.5rem; }
                .invoice-meta-block { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
                .invoice-meta-row { display: flex; gap: 2rem; width: 100%; margin-bottom: 0.5rem; }
                .invoice-meta-address { flex: 1; }
                .invoice-meta-address .invoice-meta-value { white-space: pre-line; }
                .invoice-qr-footer { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2rem; padding-top: 1rem; }
                .qr-box { padding: 1.5rem; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .qr-box :global(.upi-qr-wrap) { margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
                .qr-box :global(.upi-qr-heading) { font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em; }
                .qr-hint { margin-top: 0.75rem; font-size: 0.75rem; font-weight: 600; color: #94a3b8; }
                .invoice-meta-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
                .invoice-meta-value { font-size: 0.9375rem; font-weight: 500; color: #0f172a; }
                .invoice-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 2rem; }
                .invoice-table th { padding: 1rem 0.5rem; border-bottom: 2px solid #f1f5f9; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .invoice-table th.th-product, .invoice-table th.th-sku { text-align: left; }
                .invoice-table th.th-qty, .invoice-table th.th-price { text-align: right; }
                .invoice-table td { padding: 1.25rem 0.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                .product-name { font-weight: 600; color: #0f172a; font-size: 0.9375rem; }
                .product-sku { color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem; font-family: monospace; }
                .mobile-only-sku { display: none; }
                .td-qty { text-align: right; font-weight: 700; color: #0f172a; width: 60px; }
                .td-price { text-align: right; font-weight: 600; color: #0f172a; width: 100px; }
                
                .invoice-summary { margin-top: 1rem; border-top: 2px solid #0f172a; padding-top: 1.5rem; }
                .invoice-summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
                .invoice-summary-row.total { padding-top: 1rem; border-top: 1px dashed #e2e8f0; margin-top: 0.5rem; }
                .summary-label { font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .summary-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }

                .invoice-footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; text-align: center; }
                .thank-you { font-size: 0.9375rem; color: #64748b; font-weight: 500; font-style: italic; }
                @media print {
                    .no-print { display: none !important; }
                    .invoice-page { padding: 0 !important; max-width: none !important; margin: 0 !important; width: 100% !important; }
                    .invoice-paper { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    .invoice-actions { display: none !important; }
                }

                @media (max-width: 768px) {
                    .invoice-page { padding: 1rem 0.5rem; }
                    .invoice-actions { margin-bottom: 1rem; padding: 0 0.5rem; }
                    .invoice-print-btn { width: 100%; justify-content: center; font-size: 1rem; height: 52px; border-radius: 14px; }
                    
                    .invoice-paper { padding: 1.5rem 1.25rem; border-radius: 16px; border-width: 1px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
                    .invoice-header { flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 1rem; border-bottom-width: 2px; padding-bottom: 1.25rem; }
                    .invoice-logo-img { height: 32px; max-width: 120px; object-fit: contain; }
                    .invoice-title { font-size: 1.75rem; line-height: 1; }
                    .invoice-order-no { font-size: 0.75rem; margin-top: 0.35rem; }
                    
                    .invoice-meta { gap: 1rem; margin-bottom: 2rem; display: grid; grid-template-columns: repeat(2, 1fr); }
                    .invoice-meta-block { flex: none; width: 100%; border-bottom: 1px solid #f8fafc; padding-bottom: 0.75rem; min-width: 0; }
                    .invoice-meta-full { grid-column: span 2; }
                    .invoice-email-value { word-break: break-all; font-size: 0.8125rem; }
                    
                    .invoice-meta-row { display: contents; }
                    .invoice-meta-address { width: 100%; flex: none; }
                    
                    .invoice-table { font-size: 0.8125rem; margin-bottom: 1.5rem; }
                    .invoice-table th, .invoice-table td { padding: 1rem 0.25rem; }
                    .th-sku, .td-sku { display: none; }
                    .mobile-only-sku { display: block; }
                    .td-qty { width: 40px; }
                    .td-price { width: 80px; }
                    
                    .invoice-summary { padding-top: 1rem; }
                    .summary-value { font-size: 1.35rem; color: #0f172a; }

                    .invoice-footer { margin-top: 2.5rem; }
                    .qr-box { padding: 1.5rem; width: 100%; }
                }

                @media (max-width: 480px) {
                    .invoice-meta-block { width: 100% !important; }
                    .invoice-title { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
