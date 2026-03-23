"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface B2BUser {
    id: string;
    username: string;
    companyName: string;
}

export default function B2BAccountClient() {
    const router = useRouter();
    const [user, setUser] = useState<B2BUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        fetch("/api/b2b/me")
            .then((r) => r.json())
            .then((res) => {
                if (res.authenticated && res.user) {
                    setUser(res.user);
                } else {
                    router.replace("/b2b/login");
                }
            })
            .catch(() => router.replace("/b2b/login"))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/b2b/logout", { method: "POST" });
            // Hard redirect to fully clear all client-side session state (header, cart, etc.)
            window.location.href = "/b2b/login";
        } catch {
            setLoggingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="b2b-account-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const initials = user.companyName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <>
            <div className="b2b-account-page mt-5">
                {/* Hero Banner */}
                <div className="b2b-account-hero">
                    <div className="hero-overlay"></div>
                    <div className="container position-relative">
                        <div className="d-flex align-items-center gap-4 flex-wrap">
                            <div className="avatar-circle">{initials}</div>
                            <div>
                                <h1 className="mb-1">{user.companyName}</h1>
                                <p className="mb-0 opacity-75">
                                    <i className="bi bi-person me-2"></i>@{user.username}
                                    <span className="ms-3 badge bg-warning text-dark">
                                        <i className="bi bi-building me-1"></i>B2B Account
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Content */}
                <div className="container py-5">
                    <div className="row g-4">

                        {/* Account Details Card */}
                        <div className="col-lg-4">
                            <div className="account-card h-100">
                                <div className="card-head">
                                    <i className="bi bi-person-badge-fill me-2"></i> Account Details
                                </div>
                                <div className="card-body-inner">
                                    <div className="detail-row">
                                        <span className="detail-label"><i className="bi bi-building"></i> Company</span>
                                        <span className="detail-value">{user.companyName}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label"><i className="bi bi-person"></i> Username</span>
                                        <span className="detail-value">@{user.username}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label"><i className="bi bi-shield-check"></i> Account Type</span>
                                        <span className="detail-value">
                                            <span className="badge bg-warning text-dark">B2B Wholesale</span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label"><i className="bi bi-check-circle"></i> Status</span>
                                        <span className="detail-value">
                                            <span className="badge bg-success">Active</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="col-lg-4">
                            <div className="account-card h-100">
                                <div className="card-head">
                                    <i className="bi bi-lightning-charge-fill me-2"></i> Quick Actions
                                </div>
                                <div className="card-body-inner d-flex flex-column gap-3">
                                    {[
                                        { href: "/shop", icon: "bi-bag-heart-fill", title: "Browse Products", sub: "Explore wholesale catalogue" },
                                        { href: "/cart", icon: "bi-cart3", title: "View Cart", sub: "Review your items" },
                                        { href: "/checkout", icon: "bi-credit-card", title: "Checkout", sub: "Place your order" },
                                    ].map((action) => (
                                        <Link
                                            key={action.href}
                                            href={action.href}
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: "1rem",
                                                padding: "0.875rem 1rem",
                                                borderRadius: "14px",
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                textDecoration: "none",
                                                color: "#0f172a",
                                                transition: "all 0.22s ease",
                                                width: "100%",
                                            }}
                                            onMouseEnter={(e) => {
                                                const el = e.currentTarget;
                                                el.style.background = "linear-gradient(135deg, #1a1a2e, #0f3460)";
                                                el.style.color = "white";
                                                el.style.borderColor = "transparent";
                                                el.style.transform = "translateX(4px)";
                                                el.style.boxShadow = "0 6px 20px rgba(15,52,96,0.18)";
                                            }}
                                            onMouseLeave={(e) => {
                                                const el = e.currentTarget;
                                                el.style.background = "#f8fafc";
                                                el.style.color = "#0f172a";
                                                el.style.borderColor = "#e2e8f0";
                                                el.style.transform = "none";
                                                el.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{
                                                width: "42px", height: "42px", borderRadius: "10px",
                                                background: "linear-gradient(135deg, #ffc451, #f8a623)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "1.1rem", color: "#1a1a2e", flexShrink: 0,
                                            }}>
                                                <i className={`bi ${action.icon}`}></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>{action.title}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{action.sub}</div>
                                            </div>
                                            <i className="bi bi-arrow-right" style={{ color: "#cbd5e1", flexShrink: 0 }}></i>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* B2B Benefits Card */}
                        <div className="col-lg-4">
                            <div className="account-card h-100">
                                <div className="card-head">
                                    <i className="bi bi-star-fill me-2"></i> Your B2B Benefits
                                </div>
                                <div className="card-body-inner">
                                    <div className="benefit-item">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span>Volume-based pricing tiers</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span>Wholesale rates on bulk orders</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span>Automatic discount at checkout</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span>Priority order processing</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span>Dedicated B2B support</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* How pricing works */}
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="account-card">
                                <div className="card-head">
                                    <i className="bi bi-info-circle-fill me-2"></i> How B2B Pricing Works
                                </div>
                                <div className="card-body-inner">
                                    <p className="text-muted mb-3">
                                        As a B2B client, your pricing is automatically adjusted based on the quantity you order. The more you order, the better your price!
                                    </p>
                                    <div className="pricing-tier-demo d-flex gap-3 flex-wrap">
                                        <div className="tier-demo-box">
                                            <div className="tier-qty">Qty 1+</div>
                                            <div className="tier-label">Standard Price</div>
                                        </div>
                                        <div className="tier-arrow"><i className="bi bi-arrow-right"></i></div>
                                        <div className="tier-demo-box tier-active">
                                            <div className="tier-qty">Qty 3+</div>
                                            <div className="tier-label">Tier 1 Price</div>
                                        </div>
                                        <div className="tier-arrow"><i className="bi bi-arrow-right"></i></div>
                                        <div className="tier-demo-box tier-best">
                                            <div className="tier-qty">Qty 6+</div>
                                            <div className="tier-label">Best Price</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="text-center mt-5">
                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Logging out...</>
                            ) : (
                                <><i className="bi bi-box-arrow-right me-2"></i>Sign Out of B2B Portal</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .b2b-account-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-top: 0;
                    margin-top: 0;
                }
                .b2b-account-loading {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .b2b-account-hero {
                    position: relative;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    padding: 120px 0 60px;
                    margin-bottom: 0;
                    overflow: hidden;
                }
                .b2b-account-hero::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    opacity: 0.5;
                }
                .b2b-account-hero .container {
                    color: white;
                }
                .avatar-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ffc451, #f8a623);
                    color: #1a1a2e;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    font-weight: 800;
                    flex-shrink: 0;
                    box-shadow: 0 8px 32px rgba(255, 196, 81, 0.3);
                }
                .b2b-account-hero h1 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: white;
                    margin: 0;
                }
                .account-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid #f1f5f9;
                }
                .card-head {
                    background: linear-gradient(135deg, #1a1a2e, #0f3460);
                    color: white;
                    padding: 1rem 1.5rem;
                    font-weight: 700;
                    font-size: 0.9rem;
                    letter-spacing: 0.5px;
                }
                .card-body-inner {
                    padding: 1.5rem;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .detail-row:last-child { border-bottom: none; }
                .detail-label {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                .detail-value {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.9rem;
                }
                .action-btn {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.875rem 1rem;
                    border-radius: 14px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    text-decoration: none;
                    color: #0f172a;
                    transition: all 0.22s ease;
                    width: 100%;
                }
                .action-btn:hover {
                    background: linear-gradient(135deg, #1a1a2e, #0f3460);
                    border-color: transparent;
                    color: white;
                    transform: translateX(4px);
                    box-shadow: 0 6px 20px rgba(15,52,96,0.18);
                }
                .action-icon-box {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #ffc451, #f8a623);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    color: #1a1a2e;
                    flex-shrink: 0;
                    transition: all 0.22s ease;
                }
                .action-btn:hover .action-icon-box {
                    background: rgba(255,196,81,0.2);
                    color: #ffc451;
                }
                .action-text {
                    flex: 1;
                    min-width: 0;
                }
                .action-title {
                    font-weight: 700;
                    font-size: 0.9rem;
                    line-height: 1.2;
                }
                .action-sub {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 2px;
                    transition: color 0.22s;
                }
                .action-btn:hover .action-sub {
                    color: rgba(255,255,255,0.6);
                }
                .action-arrow {
                    font-size: 1rem;
                    color: #cbd5e1;
                    transition: all 0.22s ease;
                    flex-shrink: 0;
                }
                .action-btn:hover .action-arrow {
                    color: #ffc451;
                    transform: translateX(3px);
                }
                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.6rem 0;
                    font-size: 0.875rem;
                    color: #334155;
                    border-bottom: 1px solid #f8fafc;
                }
                .benefit-item:last-child { border-bottom: none; }
                .benefit-item i { font-size: 1rem; }
                .pricing-tier-demo {
                    align-items: center;
                }
                .tier-demo-box {
                    background: #f8fafc;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    text-align: center;
                    flex: 1;
                    min-width: 100px;
                }
                .tier-demo-box.tier-active {
                    border-color: #ffc451;
                    background: #fffbec;
                }
                .tier-demo-box.tier-best {
                    border-color: #22c55e;
                    background: #f0fdf4;
                }
                .tier-qty {
                    font-weight: 800;
                    font-size: 1rem;
                    color: #0f172a;
                }
                .tier-label {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }
                .tier-arrow {
                    color: #94a3b8;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .logout-btn {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 2px solid #fee2e2;
                    padding: 0.75rem 2rem;
                    border-radius: 50px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }
                .logout-btn:hover:not(:disabled) {
                    background: #dc2626;
                    color: white;
                    border-color: #dc2626;
                }
                .logout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .tier-demo-box { min-width: 80px; padding: 0.75rem; }
                    .tier-arrow { display: none; }
                    .pricing-tier-demo { gap: 0.5rem; }
                }
            `}</style>
        </>
    );
}
