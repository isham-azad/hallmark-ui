"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { B2BAccountShimmer, ShimmerBox } from "@/components/Shimmer";

interface B2BUser {
    id: string;
    username: string;
    companyName: string;
    rewardBalance?: number;
    rewardPercentage?: number;
    address?: string;
    zip?: string;
}

interface Transaction {
    id: string;
    orderNo: string;
    total: string;
    status: string;
    rewardsUsed: number;
    rewardsEarned: number;
    createdAt: string;
}

interface Voucher {
    id: string;
    code: string;
    amount: number;
    balance: number;
    status: string;
    expiryDate: string | null;
}

export default function B2BAccountClient() {
    const router = useRouter();
    const [user, setUser] = useState<B2BUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    // Redemption
    const [redeeming, setRedeeming] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState("");
    const [redeemMethod, setRedeemMethod] = useState("bank_transfer");
    const [redeemDetails, setRedeemDetails] = useState("");
    const [redeemSuccess, setRedeemSuccess] = useState("");
    const [redeemError, setRedeemError] = useState("");

    // Transactions
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    // Vouchers
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(true);

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

        fetch("/api/b2b/transactions")
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setTransactions(res.transactions || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingTransactions(false));

        fetch("/api/b2b/vouchers")
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setVouchers(res.vouchers || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingVouchers(false));
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

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        setRedeemError("");
        setRedeemSuccess("");

        const amt = Number(redeemAmount);
        const minBank = 1000;
        const minVoucher = 10;
        const currentMin = redeemMethod === "gift_voucher" ? minVoucher : minBank;

        if (amt < currentMin) {
            setRedeemError(`Minimum ₹${currentMin} is required for ${redeemMethod === 'gift_voucher' ? 'Gift Voucher' : 'Bank Transfer'}.`);
            return;
        }

        if (amt > (user?.rewardBalance || 0)) {
            setRedeemError("Insufficient reward balance.");
            return;
        }
        if (!redeemDetails.trim()) {
            setRedeemError("Please provide account/voucher details.");
            return;
        }

        setRedeeming(true);
        try {
            const res = await fetch("/api/b2b/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amt,
                    method: redeemMethod,
                    details: redeemDetails.trim(),
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setRedeemSuccess("Redemption request submitted successfully! We will process it shortly.");
                setRedeemAmount("");
                setRedeemDetails("");
                setUser((prev) => prev ? { ...prev, rewardBalance: data.newBalance } : null);

                // Refresh transactions list
                fetch("/api/b2b/transactions")
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.success) {
                            setTransactions(res.transactions || []);
                        }
                    })
                    .catch(console.error);
            } else {
                setRedeemError(data.error || "Failed to submit request.");
            }
        } catch {
            setRedeemError("Something went wrong. Please try again.");
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) {
        return <B2BAccountShimmer />;
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
                                        <span className="detail-label"><i className="bi bi-geo-alt"></i> Address</span>
                                        <span className="detail-value text-end" style={{ maxWidth: '200px' }}>{user.address || "—"}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label"><i className="bi bi-pin-map"></i> Pincode</span>
                                        <span className="detail-value">{user.zip || "—"}</span>
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

                    {/* Rewards & Redemption Row */}
                    <div className="row mt-4">
                        <div className="col-lg-12">
                            <div className="account-card">
                                <div className="card-head bg-warning text-dark border-bottom-0 pb-3" style={{ background: "linear-gradient(135deg, #ffc451, #f8a623)" }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-0 fw-bold"><i className="bi bi-gift-fill me-2"></i> Rewards Program</h5>
                                            <div className="small mt-1 opacity-75">Earn {user.rewardPercentage ?? 0}% points on every purchase!</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="small opacity-75">Available Balance</div>
                                            <h3 className="mb-0 fw-bold">₹{(user.rewardBalance || 0).toFixed(2)}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body-inner">
                                    <div className="row g-4">
                                        <div className="col-md-5 border-end-md">
                                            <h6 className="fw-bold mb-3">Redeem Points</h6>
                                            <p className="small text-muted mb-4">
                                                You can apply your points during checkout or request a redemption here.
                                                <br />
                                                <span className="fw-bold text-dark">Min: ₹1000 for Bank Transfer | ₹10 for Gift Voucher.</span>
                                            </p>

                                            {redeemSuccess && <div className="alert alert-success py-2 small">{redeemSuccess}</div>}
                                            {redeemError && <div className="alert alert-danger py-2 small">{redeemError}</div>}

                                            <form onSubmit={handleRedeem}>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Redemption Method</label>
                                                    <select className="form-select form-select-sm" value={redeemMethod} onChange={(e) => setRedeemMethod(e.target.value)}>
                                                        <option value="bank_transfer">Bank Transfer</option>
                                                        <option value="gift_voucher">Gift Voucher</option>
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Amount to Redeem (₹)</label>
                                                    <div className="input-group input-group-sm">
                                                        <input type="number" className="form-control" placeholder="Enter amount" min={redeemMethod === 'gift_voucher' ? 10 : 1000} max={user.rewardBalance || 0} value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)} required />
                                                        <span className="input-group-text small bg-light text-muted" style={{ fontSize: '0.7rem' }}>
                                                            Min: ₹{redeemMethod === 'gift_voucher' ? '10' : '1000'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">{redeemMethod === 'bank_transfer' ? 'Bank Account Details' : 'Email Address for Voucher'}</label>
                                                    <textarea className="form-control form-control-sm" rows={2} placeholder={redeemMethod === 'bank_transfer' ? "Acc No, IFSC, Account Name" : "Email address"} value={redeemDetails} onChange={(e) => setRedeemDetails(e.target.value)} required></textarea>
                                                </div>
                                                <button type="submit" className="btn btn-warning btn-sm w-100 fw-bold shadow-sm" disabled={redeeming || (user.rewardBalance || 0) <= 0}>
                                                    {redeeming ? "Submitting..." : "Submit Request"}
                                                </button>
                                            </form>
                                        </div>
                                        <div className="col-md-7 ps-md-4">
                                            <h6 className="fw-bold mb-3">Recent Transactions</h6>
                                            {loadingTransactions ? (
                                                <div className="d-flex flex-column gap-1 mb-4">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
                                                            <div className="flex-grow-1">
                                                                <ShimmerBox style={{ height: 16, width: 140, marginBottom: 8 }} />
                                                                <ShimmerBox style={{ height: 10, width: 90 }} />
                                                            </div>
                                                            <div className="text-end">
                                                                <ShimmerBox style={{ height: 16, width: 110, marginBottom: 6 }} />
                                                                <ShimmerBox style={{ height: 10, width: 70 }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : transactions.length > 0 ? (
                                                <div className="transaction-list">
                                                    {transactions.map((tx) => (
                                                        <div key={tx.id} className="transaction-item mb-2 p-2 border-bottom">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className="fw-bold small">{tx.orderNo}</div>
                                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                                </div>
                                                                <div className="text-end">
                                                                    {tx.rewardsEarned > 0 && (
                                                                        <div className="text-success small fw-bold">+₹{tx.rewardsEarned.toFixed(2)} Earned</div>
                                                                    )}
                                                                    {tx.rewardsUsed > 0 && (
                                                                        <div className="text-danger small fw-bold">-₹{tx.rewardsUsed.toFixed(2)} Used</div>
                                                                    )}
                                                                    <div className="text-muted smaller" style={{ fontSize: '0.65rem' }}>{tx.status}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-muted small text-center py-5 bg-light rounded">
                                                    <i className="bi bi-clock-history fs-4 d-block mb-2"></i>
                                                    No recent reward transactions.
                                                </div>
                                            )}

                                            <div className="mt-5 border-top pt-4">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center">
                                                    <i className="bi bi-ticket-perforated-fill text-warning me-2"></i>
                                                    My Gift Vouchers
                                                </h6>
                                                {loadingVouchers ? (
                                                    <div className="d-flex flex-column gap-3 mb-4">
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="p-4 rounded-4 border bg-white shadow-sm d-flex justify-content-between align-items-center">
                                                                <div className="flex-grow-1">
                                                                    <div className="small text-muted mb-2"><ShimmerBox style={{ height: 10, width: 40 }} /></div>
                                                                    <ShimmerBox style={{ height: 28, width: 160, borderRadius: 6 }} />
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className="small text-muted mb-2"><ShimmerBox style={{ height: 10, width: 60 }} /></div>
                                                                    <ShimmerBox style={{ height: 32, width: 110, borderRadius: 8 }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : vouchers.length > 0 ? (
                                                    <div className="voucher-cards">
                                                        {vouchers.map((v) => (
                                                            <div key={v.id} className="voucher-card p-3 mb-3 rounded-3 border shadow-sm" style={{ background: "#fff", borderLeft: "4px solid #ffc451 !important" }}>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <div className="small text-muted mb-1">Code</div>
                                                                        <code className="fw-bold text-dark fs-5">{v.code}</code>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <div className="small text-muted mb-1">Balance</div>
                                                                        <h4 className="mb-0 fw-bold text-success">₹{v.balance}</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-light">
                                                                    <div className="small text-muted">
                                                                        {v.expiryDate ? `Expires: ${new Date(v.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                                                                    </div>
                                                                    <span className={`badge rounded-pill bg-light ${v.status === 'Active' ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                                                                        {v.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small text-center py-4 bg-light rounded italic">
                                                        No active gift vouchers yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
