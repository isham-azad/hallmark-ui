"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { buildUpiLink, buildGPayLink, buildPhonePeLink, buildPaytmLink } from "@/lib/upi";

function PaymentRedirect() {
    const searchParams = useSearchParams();
    const queryN = searchParams.get("n");
    const amountStr = searchParams.get("a");
    const [os, setOs] = useState<"android" | "ios" | "unknown">("unknown");
    const [loading, setLoading] = useState(true);
    const [paid, setPaid] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const orderNo = queryN || undefined;
    const amount = amountStr ? parseFloat(amountStr) : 0;
    const upiLink = buildUpiLink(amount, orderNo);

    // Get specific links using the shared lib
    const getGPayLink = () => buildGPayLink(amount, orderNo, os) || "#";
    const getPhonePeLink = () => buildPhonePeLink(amount, orderNo, os) || "#";
    const getPaytmLink = () => buildPaytmLink(amount, orderNo, os) || "#";

    // Detect OS for specific app deep links
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        if (/android/i.test(userAgent)) {
            setOs("android");
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            setOs("ios");
        }
    }, []);

    // Fetch order status on mount
    useEffect(() => {
        if (!orderNo) {
            setLoading(false);
            return;
        }

        async function checkStatus() {
            try {
                const res = await fetch(`/api/site/orders?n=${orderNo}`);
                const data = await res.json();
                if (res.status === 404) {
                    setNotFound(true);
                } else if (data.success) {
                    if (data.paymentStatus?.toLowerCase() === "paid") {
                        setPaid(true);
                    }
                }
            } catch (error) {
                console.error("Order check failed:", error);
            } finally {
                setLoading(false);
            }
        }

        checkStatus();
    }, [orderNo]);



    if (loading) {
        return (
            <section className="pay-redirect-section">
                <div className="text-center">

                    <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '0.25rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>Verifying Session</p>
                </div>
            </section>
        );
    }

    if (notFound || !orderNo || amount <= 0) {
        return (
            <section className="pay-redirect-section">
                <div className="container px-4">
                    <div className="row justify-content-center mt-5">
                        <div className="col-lg-5 col-md-8 px-0">
                            <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                                <div className="card-body p-4 pt-5 p-md-5 text-center">
                                    <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                            color: '#dc3545',
                                            border: '1px solid rgba(220, 53, 69, 0.2)'
                                        }}>
                                        <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: '2.5rem' }}></i>
                                    </div>
                                    <h2 className="h4 fw-bold mb-2 text-dark">Session Expired</h2>
                                    <p className="text-muted mb-4 small mx-auto" style={{ maxWidth: '280px' }}>
                                        The payment link is invalid or has expired. Please check your SMS for the latest link.
                                    </p>
                                    <a href="/" className="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-sm">
                                        Back to Home
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (paid) {
        return (
            <section className="pay-redirect-section">
                <div className="container px-4">
                    <div className="row justify-content-center mt-5">
                        <div className="col-lg-5 col-md-8 px-0">
                            <div className="card border-0 shadow-sm rounded-4 animate__animated animate__fadeIn">
                                <div className="card-body p-4 pt-5 p-md-5 text-center">
                                    <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                            color: '#198754',
                                            border: '1px solid rgba(25, 135, 84, 0.2)'
                                        }}>
                                        <i className="bi bi-patch-check-fill" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <h2 className="h4 fw-bold mb-2 text-dark">Already Paid</h2>
                                    <p className="text-muted mb-4 small mx-auto" style={{ maxWidth: '280px' }}>
                                        We've already received payment for this order. Your order is being processed!
                                    </p>
                                    <a href="/" className="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-sm">
                                        Return to Home
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }



    return (
        <section className="pay-redirect-section">
            <div className="container px-4">
                <div className="row justify-content-center mt-md-4">
                    <div className="col-lg-5 col-md-8 px-0">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 p-md-5 text-center">
                                <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                                    style={{
                                        width: '74px',
                                        height: '74px',
                                        backgroundColor: 'rgba(255, 196, 81, 0.15)',
                                        color: '#ffc451',
                                        border: '1px solid rgba(255, 196, 81, 0.2)'
                                    }}>
                                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.2rem' }}></i>
                                </div>

                                <h1 className="h4 fw-bold mb-2 text-dark">Secure UPI Payment</h1>
                                <p className="text-muted mb-4 small">Select your preferred app to complete your order.</p>

                                <div className="bg-light p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center border border-dashed border-secondary-subtle text-start">
                                    <div>
                                        <label className="d-block text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Order</label>
                                        <span className="fw-bold text-dark">{orderNo.startsWith('#') ? orderNo : `#${orderNo}`}</span>
                                    </div>
                                    <div className="text-end">
                                        <label className="d-block text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Amount</label>
                                        <span className="fw-bold text-dark h5 mb-0">₹{amount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h2 className="h6 fw-bold text-muted text-uppercase mb-3 text-start px-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Available Apps</h2>

                                    <div className="row gx-2 gy-2">
                                        <div className="col-4 px-1">
                                            <a
                                                href={getGPayLink()}
                                                className="btn btn-white border border-secondary-subtle w-100 rounded-4 py-3 h-100 d-flex flex-column align-items-center justify-content-center payment-btn"
                                            >
                                                {/* Colorful GPay Icon Wrapper */}
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <img width={60} height={30} src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/3840px-Google_Pay_Logo.svg.png" />
                                                </div>
                                            </a>
                                        </div>
                                        <div className="col-4 px-1">
                                            <a
                                                href={getPhonePeLink()}
                                                className="btn btn-white border border-secondary-subtle w-100 rounded-4 py-3 h-100 d-flex flex-column align-items-center justify-content-center payment-btn"
                                            >
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <img className="w-100" src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1280px-PhonePe_Logo.svg.png" />

                                                </div>
                                            </a>
                                        </div>
                                        <div className="col-4 px-1">
                                            <a
                                                href={getPaytmLink()}
                                                className="btn btn-white border border-secondary-subtle w-100 rounded-4 py-3 h-100 d-flex flex-column align-items-center justify-content-center payment-btn"
                                            >
                                                <img width={60} height={20} src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Paytm_logo.jpg" />
                                            </a>
                                        </div>

                                    </div>

                                    <div className="mt-3 text-center">
                                        <a href={upiLink || "#"} className="text-muted small text-decoration-underline">
                                            Or use another UPI app
                                        </a>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top">
                                    <p className="text-muted small mb-0 d-flex align-items-center justify-content-center text-center px-1" style={{ fontSize: '0.72rem' }}>
                                        <i className="bi bi-info-circle me-2 flex-shrink-0"></i>
                                        Click as specific logo above to avoid default app selections.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-4">
                            <a href="/" className="text-decoration-none text-muted small opacity-75 hover-opacity-100">
                                <i className="bi bi-arrow-left me-1"></i> Return to Hallmark
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .pay-redirect-section {
                    background: radial-gradient(circle at top right, #fcfcfc 0%, #f1f5f9 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-top: 100px; /* Extra room for fixed site header */
                    padding-bottom: 60px;
                }
                :global(.payment-btn) {
                    background-color: #fff !important;
                    transition: all 0.2s ease !important;
                    border: 1px solid #e2e8f0 !important;
                    min-height: 85px;
                }
                :global(.payment-btn:hover) {
                    background-color: #f8fafc !important;
                    border-color: #ffc451 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                }
                @media (max-width: 767px) {
                    .pay-redirect-section {
                        padding-top: 100px !important;
                        padding-bottom: 40px !important;
                        min-height: auto !important;
                    }
                }
                .hover-opacity-100:hover {
                    opacity: 1 !important;
                    color: #000 !important;
                }
            `}</style>




        </section>
    );
}

export default function PPage() {
    return (
        <Suspense fallback={null}>
            <PaymentRedirect />
        </Suspense>
    );
}
