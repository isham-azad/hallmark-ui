"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import UPIQrCode from "@/components/UPIQrCode";
import { parseOrderTotal } from "@/lib/upi";

export default function OrderSuccessClient() {
    const searchParams = useSearchParams();
    const [orderDate, setOrderDate] = useState("");
    const orderNo = searchParams.get("orderNo") || "—";
    const total = searchParams.get("total") || "—";
    const payment = searchParams.get("payment") || "—";
    const amount = parseOrderTotal(total);
    const isUpi = payment.toUpperCase() === "UPI";
    const displayOrderNo = orderNo.startsWith("#") ? orderNo : `#${orderNo}`;

    useEffect(() => {
        const now = new Date();
        setOrderDate(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    }, []);

    return (
        <>
            <div className="page-title mt-1" data-aos="fade">
                <div className="heading"></div>
            </div>

            <section id="order-success" className="order-success section order-success-page">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 col-xl-6">
                            <div className="success-card">
                                <div className="success-card-head">
                                    <div className="success-icon-wrap">
                                        <i className="bi bi-check-circle-fill success-icon" aria-hidden />
                                    </div>
                                    <h1 className="success-title">Order Placed Successfully!</h1>
                                    <p className="success-subtitle">Your order has been confirmed and will be processed shortly.</p>
                                </div>

                                <div className="success-order-box">
                                    <div className="success-order-row">
                                        <span className="success-order-label">
                                            <i className="bi bi-receipt" aria-hidden /> Order Number
                                        </span>
                                        <span className="success-order-value success-order-id">{displayOrderNo}</span>
                                    </div>
                                    <div className="success-order-row">
                                        <span className="success-order-label">
                                            <i className="bi bi-calendar3" aria-hidden /> Order Date
                                        </span>
                                        <span className="success-order-value">{orderDate}</span>
                                    </div>
                                    <div className="success-order-row">
                                        <span className="success-order-label">
                                            <i className="bi bi-currency-rupee" aria-hidden /> Total Amount
                                        </span>
                                        <span className="success-order-value success-order-total">
                                            {total === "—" ? "—" : `₹${total}`}
                                        </span>
                                    </div>
                                    <div className="success-order-row">
                                        <span className="success-order-label">
                                            <i className="bi bi-credit-card" aria-hidden /> Payment Method
                                        </span>
                                        <span className="success-order-value">{payment}</span>
                                    </div>
                                </div>

                                {isUpi && (
                                    <div className="success-upi-box">
                                        <div className="success-info-content">
                                            <i className="bi bi-info-circle-fill me-2" />
                                            <span>Please make payment to the delivery person upon delivery of the product using your UPI payment mode.</span>
                                        </div>
                                    </div>
                                )}

                                {payment.toUpperCase().includes("COD") && (
                                    <div className="success-upi-box cash-box">
                                        <div className="success-info-content">
                                            <i className="bi bi-info-circle-fill me-2" />
                                            <span>Please make payment to the delivery person upon delivery of the product by Cash.</span>
                                        </div>
                                    </div>
                                )}

                                <div className="success-actions">
                                    <Link href="/shop" className="success-btn success-btn-primary">
                                        Continue Shopping
                                    </Link>
                                    <Link href="/" className="success-btn success-btn-secondary">
                                        Back to Home
                                    </Link>
                                </div>

                                <p className="success-footer-note">
                                    <i className="bi bi-envelope-check" aria-hidden /> You will receive an SMS confirmation shortly with your order details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
                .order-success-page { padding: 2rem 0 4rem; }
                .success-card {
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                    border: 1px solid #eee;
                    overflow: hidden;
                    text-align: center;
                }
                .success-card-head { padding: 2.5rem 2rem 1.5rem; }
                .success-icon-wrap { margin-bottom: 1.25rem; }
                .success-icon {
                    font-size: 4rem;
                    color: #16a34a;
                    display: inline-block;
                    animation: successPop 0.5s ease-out;
                }
                @keyframes successPop {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    70% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .success-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 0.5rem;
                    letter-spacing: -0.02em;
                }
                .success-subtitle {
                    font-size: 1rem;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }
                .success-order-box {
                    margin: 0 2rem;
                    padding: 1.5rem 1.75rem;
                    background: #f8fafc;
                    border-radius: 14px;
                    text-align: left;
                }
                .success-order-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.65rem 0;
                    border-bottom: 1px solid #e2e8f0;
                    gap: 1rem;
                }
                .success-order-row:last-child { border-bottom: none; }
                .success-order-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .success-order-label i { font-size: 1rem; color: #94a3b8; }
                .success-order-value {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: #0f172a;
                }
                .success-order-id { font-family: ui-monospace, monospace; letter-spacing: 0.02em; }
                .success-order-total { font-size: 1.25rem; color: var(--accent-color, #ffc451); }
                .success-upi-box {
                    margin: 1.5rem 2rem 0;
                    padding: 1.25rem 1.75rem;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .success-upi-box.cash-box {
                    background: #fffbeb;
                    border-color: #fde68a;
                }
                .success-info-content {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: #166534;
                    line-height: 1.5;
                }
                .cash-box .success-info-content {
                    color: #92400e;
                }
                .success-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    justify-content: center;
                    padding: 2rem 2rem 1rem;
                }
                .success-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.875rem 1.75rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .success-btn:hover { transform: translateY(-2px); }
                .success-btn-primary {
                    background: var(--accent-color, #ffc451);
                    color: #0f172a;
                    border: none;
                    box-shadow: 0 4px 14px rgba(255, 196, 81, 0.4);
                }
                .success-btn-primary:hover { box-shadow: 0 6px 20px rgba(255, 196, 81, 0.5); }
                .success-btn-secondary {
                    background: #fff;
                    color: #475569;
                    border: 2px solid #e2e8f0;
                }
                .success-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
                .success-footer-note {
                    font-size: 0.875rem;
                    color: #94a3b8;
                    margin: 0 2rem 2rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .success-footer-note i { font-size: 1rem; }
                @media (max-width: 576px) {
                    .success-order-box, .success-upi-box { margin-left: 1rem; margin-right: 1rem; }
                    .success-card-head { padding: 1.75rem 1rem 1.25rem; }
                    .success-title { font-size: 1.5rem; }
                    .success-actions { padding: 1.5rem 1rem 1rem; flex-direction: column; }
                    .success-btn { width: 100%; }
                    .success-footer-note { margin-left: 1rem; margin-right: 1rem; margin-bottom: 1.5rem; }
                }
            `}</style>
        </>
    );
}
