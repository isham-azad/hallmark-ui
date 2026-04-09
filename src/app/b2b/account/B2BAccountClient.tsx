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

interface B2BOrderItem {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
    image: string | null;
}

interface B2BOrder {
    id: string;
    orderNo: string;
    customer: string;
    total: string;
    subtotal: string | null;
    shippingAmount: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    rewardsEarned: number;
    rewardsUsed: number;
    voucherAmount: number;
    address: string | null;
    city: string | null;
    zip: string | null;
    items: B2BOrderItem[];
    createdAt: string;
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
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);

    // Offcanvas state
    const [showTxOffcanvas, setShowTxOffcanvas] = useState(false);
    const [txFilter, setTxFilter] = useState("All");
    const [txSearch, setTxSearch] = useState("");

    // Order History offcanvas
    const [orders, setOrders] = useState<B2BOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [showOrdersOffcanvas, setShowOrdersOffcanvas] = useState(false);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("All");
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const isProduction = process.env.NODE_ENV === "production";

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

    const openOrderHistory = () => {
        setShowOrdersOffcanvas(true);
        if (orders.length === 0) {
            setLoadingOrders(true);
            fetch("/api/b2b/orders")
                .then((r) => r.json())
                .then((res) => { if (res.success) setOrders(res.orders || []); })
                .catch(console.error)
                .finally(() => setLoadingOrders(false));
        }
    };

    const exportOrdersCSV = () => {
        const filtered = orders.filter(o => {
            const q = orderSearch.toLowerCase().trim();
            if (q && !o.orderNo.toLowerCase().includes(q)) return false;
            if (orderStatusFilter !== "All" && o.status !== orderStatusFilter) return false;
            return true;
        });
        if (filtered.length === 0) return;

        const headers = ["Order No", "Date", "Status", "Payment Method", "Payment Status", "Items", "Rewards Used", "Voucher Applied", "Total"];
        const rows = filtered.map(o => [
            o.orderNo,
            new Date(o.createdAt).toLocaleDateString("en-IN"),
            o.status,
            o.paymentMethod,
            o.paymentStatus,
            o.items.map(i => `${i.name} x${i.qty}`).join("; "),
            o.rewardsUsed > 0 ? `₹${o.rewardsUsed.toFixed(2)}` : "",
            o.voucherAmount > 0 ? `₹${o.voucherAmount.toFixed(2)}` : "",
            o.total,
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, "\"\"")}"` ).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportTransactionsCSV = () => {
        const filtered = transactions.filter(tx => {
            const q = txSearch.toLowerCase().trim();
            if (q) {
                const dateStr = new Date(tx.createdAt).toLocaleDateString().toLowerCase();
                if (!tx.orderNo.toLowerCase().includes(q) && !dateStr.includes(q)) return false;
            }
            if (txFilter === "Earned") return tx.rewardsEarned > 0;
            if (txFilter === "Used") return tx.rewardsUsed > 0 && !tx.orderNo.toLowerCase().includes("redemption");
            if (txFilter === "Redemption") return tx.orderNo.toLowerCase().includes("redemption");
            return true;
        });
        if (filtered.length === 0) return;

        const headers = ["Transaction", "Date", "Status", "Earned", "Used"];
        const rows = filtered.map(tx => [
            tx.orderNo,
            new Date(tx.createdAt).toLocaleDateString("en-IN"),
            tx.status,
            tx.rewardsEarned > 0 ? `₹${tx.rewardsEarned.toFixed(2)}` : "0",
            tx.rewardsUsed > 0 ? `₹${tx.rewardsUsed.toFixed(2)}` : "0",
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, "\"\"")}"` ).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

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
        const minBank = isProduction ? 1000 : 1;
        const minVoucher = isProduction ? 10 : 1;
        const currentMin = redeemMethod === "gift_voucher" ? minVoucher : minBank;

        if (amt < currentMin) {
            setRedeemError(`Minimum ₹${currentMin} is required for ${redeemMethod === 'gift_voucher' ? 'Gift Voucher' : 'Bank Transfer'}.`);
            return;
        }

        if (amt > (user?.rewardBalance || 0)) {
            setRedeemError("Insufficient reward balance.");
            return;
        }

        const isEmailOptional = !isProduction && redeemMethod === "gift_voucher";
        if (!isEmailOptional && !redeemDetails.trim()) {
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
                                    {/* Order History button */}
                                    <button
                                        type="button"
                                        onClick={openOrderHistory}
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.875rem 1rem",
                                            borderRadius: "14px",
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            color: "#0f172a",
                                            transition: "all 0.22s ease",
                                            width: "100%",
                                            cursor: "pointer",
                                            textAlign: "left",
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
                                            <i className="bi bi-clock-history"></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>Order History</div>
                                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>View all your past orders</div>
                                        </div>
                                        <i className="bi bi-arrow-right" style={{ color: "#cbd5e1", flexShrink: 0 }}></i>
                                    </button>
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
                                                <span className="fw-bold text-dark">
                                                    {isProduction ? "Min: ₹1000 for Bank Transfer | ₹10 for Gift Voucher." : "Min: ₹1 (Local Testing Mode)."}
                                                </span>
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
                                                        <input type="number" className="form-control" placeholder="Enter amount" min={redeemMethod === 'gift_voucher' ? (isProduction ? 10 : 1) : (isProduction ? 1000 : 1)} max={user.rewardBalance || 0} value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)} required />
                                                        <span className="input-group-text small bg-light text-muted" style={{ fontSize: '0.7rem' }}>
                                                            Min: ₹{redeemMethod === 'gift_voucher' ? (isProduction ? '10' : '1') : (isProduction ? '1000' : '1')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">{redeemMethod === 'bank_transfer' ? 'Bank Account Details' : 'Email Address for Voucher' + (!isProduction ? ' (Optional)' : '')}</label>
                                                    <textarea className="form-control form-control-sm" rows={2} placeholder={redeemMethod === 'bank_transfer' ? "Acc No, IFSC, Account Name" : (!isProduction ? "Leave blank for testing" : "Email address")} value={redeemDetails} onChange={(e) => setRedeemDetails(e.target.value)} required={isProduction || redeemMethod === 'bank_transfer'}></textarea>
                                                </div>
                                                <button type="submit" className="btn btn-warning btn-sm w-100 fw-bold shadow-sm" disabled={redeeming || (user.rewardBalance || 0) <= 0}>
                                                    {redeeming ? "Submitting..." : "Submit Request"}
                                                </button>
                                            </form>
                                        </div>
                                        <div className="col-md-7 ps-md-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="fw-bold mb-0">Recent Transactions</h6>
                                                {transactions.length > 3 && (
                                                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setShowTxOffcanvas(true)}>View All</button>
                                                )}
                                            </div>
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
                                                    {transactions.slice(0, 3).map((tx) => (
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
                                                    <div className="d-flex flex-wrap gap-3">
                                                        {vouchers.map((v) => {
                                                            const isExhausted = v.balance <= 0 || v.status?.toLowerCase().includes('exhaust');
                                                            const isExpired = v.expiryDate && new Date(v.expiryDate) < new Date() || v.status?.toLowerCase().includes('expire');
                                                            const isInactive = isExhausted || isExpired;

                                                            return (
                                                                <div 
                                                                    key={v.id} 
                                                                    className={`voucher-mini-box ${isInactive ? 'is-disabled' : ''}`}
                                                                    onClick={() => !isInactive && setViewingVoucher(v)}
                                                                >
                                                                    <div className="mini-box-icon">
                                                                        <i className={`bi ${isInactive ? 'bi-ticket-x' : 'bi-ticket-perforated'}`}></i>
                                                                    </div>
                                                                    <div className="mini-box-content">
                                                                        <div className="mini-box-code">{v.code.substring(0, 4)}...{v.code.slice(-4)}</div>
                                                                        <div className="mini-box-balance" style={{ color: isInactive ? '#94a3b8' : '#16a34a' }}>
                                                                            ₹{v.balance.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                    <div 
                                                                        className="mini-box-badge"
                                                                        style={{ 
                                                                            background: isExhausted ? '#fff1f2' : isExpired ? '#f1f5f9' : '#f1f5f9',
                                                                            color: isExhausted ? '#e11d48' : '#64748b'
                                                                        }}
                                                                    >
                                                                        {v.status}
                                                                    </div>
                                                                    <div className={`mini-box-hover ${isInactive ? 'bg-secondary opacity-75' : ''}`}>
                                                                        {isInactive ? (
                                                                            <span className="small">{isExhausted ? 'Balance Empty' : 'Expired'}</span>
                                                                        ) : (
                                                                            <>
                                                                                <span>View Details</span>
                                                                                <i className="bi bi-arrow-up-right ms-1"></i>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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

            {/* Order History Offcanvas */}
            <div
                className={`offcanvas offcanvas-end ${showOrdersOffcanvas ? "show" : ""}`}
                style={{ visibility: showOrdersOffcanvas ? "visible" : "hidden", width: "480px", zIndex: 1055, display: "flex", flexDirection: "column" }}
                tabIndex={-1}
            >
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "1.25rem 1.5rem", flexShrink: 0 }}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 style={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem", margin: 0 }}>
                                <i className="bi bi-clock-history me-2" style={{ color: "#ffc451" }}></i>Order History
                            </h5>
                            <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "4px 0 0" }}>
                                {orders.length} order{orders.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                onClick={exportOrdersCSV}
                                disabled={orders.length === 0}
                                title="Export as CSV"
                                style={{
                                    background: orders.length === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,196,81,0.15)",
                                    border: `1px solid ${orders.length === 0 ? "rgba(255,255,255,0.1)" : "#ffc451"}`,
                                    color: orders.length === 0 ? "#64748b" : "#ffc451",
                                    borderRadius: "10px", padding: "6px 14px",
                                    fontSize: "0.75rem", fontWeight: 700, cursor: orders.length === 0 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                                }}
                            >
                                <i className="bi bi-download"></i> Export CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOrdersOffcanvas(false)}
                                aria-label="Close"
                                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "8px", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem" }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Search + Filters inside header */}
                    <div className="mt-3 position-relative">
                        <i className="bi bi-search position-absolute" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.82rem", pointerEvents: "none" }}></i>
                        <input
                            type="text"
                            placeholder="Search by order no..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            style={{ width: "100%", paddingLeft: "34px", paddingRight: orderSearch ? "34px" : "12px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                        />
                        {orderSearch && (
                            <button onClick={() => setOrderSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}>
                                <i className="bi bi-x-lg" style={{ fontSize: "0.8rem" }}></i>
                            </button>
                        )}
                    </div>

                    <div className="d-flex gap-2 mt-3" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: "2px" }}>
                        {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => (
                            <button
                                key={s}
                                onClick={() => setOrderStatusFilter(s)}
                                style={{
                                    flexShrink: 0, border: "none", borderRadius: "20px",
                                    padding: "4px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                    background: orderStatusFilter === s ? "#ffc451" : "rgba(255,255,255,0.1)",
                                    color: orderStatusFilter === s ? "#1a1a2e" : "#94a3b8",
                                }}
                            >{s}</button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", background: "#f8fafc" }}>
                    {loadingOrders ? (
                        <div className="d-flex flex-column gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "1rem", border: "1px solid #e2e8f0" }}>
                                    <div className="placeholder-glow mb-2"><span className="placeholder col-5 rounded" style={{ height: 16 }}></span></div>
                                    <div className="placeholder-glow"><span className="placeholder col-3 rounded" style={{ height: 12 }}></span></div>
                                </div>
                            ))}
                        </div>
                    ) : orders.filter(o => {
                        const q = orderSearch.toLowerCase().trim();
                        if (q && !o.orderNo.toLowerCase().includes(q)) return false;
                        if (orderStatusFilter !== "All" && o.status !== orderStatusFilter) return false;
                        return true;
                    }).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
                            <i className="bi bi-inbox" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem", opacity: 0.3 }}></i>
                            <p style={{ fontWeight: 600, margin: 0 }}>{orderSearch ? `No results for "${orderSearch}"` : "No orders found."}</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {orders
                                .filter(o => {
                                    const q = orderSearch.toLowerCase().trim();
                                    if (q && !o.orderNo.toLowerCase().includes(q)) return false;
                                    if (orderStatusFilter !== "All" && o.status !== orderStatusFilter) return false;
                                    return true;
                                })
                                .map(order => {
                                    const isExpanded = expandedOrderId === order.id;
                                    const statusMap: Record<string, { color: string; bg: string; dot: string }> = {
                                        Delivered:  { color: "#16a34a", bg: "#f0fdf4", dot: "#22c55e" },
                                        Processing: { color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
                                        Shipped:    { color: "#0369a1", bg: "#eff6ff", dot: "#3b82f6" },
                                        Pending:    { color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
                                        Cancelled:  { color: "#dc2626", bg: "#fef2f2", dot: "#f87171" },
                                    };
                                    const st = statusMap[order.status] || statusMap.Pending;
                                    return (
                                        <div key={order.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s" }}>
                                            {/* Order Row */}
                                            <div
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", letterSpacing: "-0.01em" }}>{order.orderNo}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                                                        <i className="bi bi-calendar3 me-1"></i>
                                                        {new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                                                        <span className="ms-2"><i className="bi bi-box-seam me-1"></i>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                                                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}22`, borderRadius: "999px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }}></span>
                                                        {order.status}
                                                    </span>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>{order.total}</div>
                                                    </div>
                                                    <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} style={{ color: "#cbd5e1", fontSize: "0.75rem" }}></i>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.25rem", background: "#fafafa" }}>
                                                    {/* Items */}
                                                    <div style={{ marginBottom: "1rem" }}>
                                                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>Items Ordered</div>
                                                        <div className="d-flex flex-column gap-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#fff", borderRadius: "10px", padding: "0.6rem 0.75rem", border: "1px solid #f1f5f9" }}>
                                                                    {item.image ? (
                                                                        <img src={item.image} alt={item.name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }} />
                                                                    ) : (
                                                                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                            <i className="bi bi-box" style={{ color: "#94a3b8", fontSize: "1rem" }}></i>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                                                                        {item.sku && item.sku !== "Standard" && (
                                                                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontFamily: "monospace" }}>SKU: {item.sku}</div>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{item.price}</div>
                                                                        <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>×{item.qty}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Price Summary */}
                                                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
                                                        {order.rewardsUsed > 0 && (
                                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                                                                <span style={{ color: "#16a34a" }}>🏅 Rewards Applied</span>
                                                                <span style={{ fontWeight: 700, color: "#16a34a" }}>-₹{order.rewardsUsed.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {order.voucherAmount > 0 && (
                                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                                                                <span style={{ color: "#6366f1" }}>🎟️ Voucher Applied</span>
                                                                <span style={{ fontWeight: 700, color: "#6366f1" }}>-₹{order.voucherAmount.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: (order.rewardsUsed > 0 || order.voucherAmount > 0) ? "1px dashed #e2e8f0" : "none", paddingTop: (order.rewardsUsed > 0 || order.voucherAmount > 0) ? "0.5rem" : 0, marginTop: (order.rewardsUsed > 0 || order.voucherAmount > 0) ? "0.4rem" : 0 }}>
                                                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>Total Paid</span>
                                                            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>{order.total}</span>
                                                        </div>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                                        <div style={{ flex: 1, minWidth: "120px", background: "#fff", borderRadius: "10px", border: "1px solid #f1f5f9", padding: "0.6rem 0.75rem" }}>
                                                            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Payment</div>
                                                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{order.paymentMethod}</div>
                                                            <span style={{ background: order.paymentStatus === "Paid" ? "#f0fdf4" : "#fffbeb", color: order.paymentStatus === "Paid" ? "#16a34a" : "#b45309", border: `1px solid ${order.paymentStatus === "Paid" ? "#bbf7d0" : "#fde68a"}`, borderRadius: "999px", padding: "1px 8px", fontSize: "0.62rem", fontWeight: 700 }}>{order.paymentStatus}</span>
                                                        </div>
                                                        {(order.address || order.city) && (
                                                            <div style={{ flex: 2, minWidth: "160px", background: "#fff", borderRadius: "10px", border: "1px solid #f1f5f9", padding: "0.6rem 0.75rem" }}>
                                                                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Delivery Address</div>
                                                                <div style={{ fontWeight: 500, fontSize: "0.78rem", color: "#475569" }}>{[order.address, order.city, order.zip].filter(Boolean).join(", ")}</div>
                                                            </div>
                                                        )}
                                                        {order.rewardsEarned > 0 && (
                                                            <div style={{ flex: 1, minWidth: "120px", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: "10px", border: "1px solid #bbf7d0", padding: "0.6rem 0.75rem" }}>
                                                                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Rewards Earned</div>
                                                                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#15803d" }}>+₹{order.rewardsEarned.toFixed(2)}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                </div>
            </div>
            {showOrdersOffcanvas && (
                <div className="offcanvas-backdrop fade show" onClick={() => setShowOrdersOffcanvas(false)}></div>
            )}

            {/* Reward Transactions Offcanvas */}
            <div
                className={`offcanvas offcanvas-end ${showTxOffcanvas ? "show" : ""}`}
                style={{ visibility: showTxOffcanvas ? "visible" : "hidden", width: "480px", zIndex: 1055, display: "flex", flexDirection: "column" }}
                tabIndex={-1}
            >
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "1.25rem 1.5rem", flexShrink: 0 }}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 style={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem", margin: 0 }}>
                                <i className="bi bi-gift-fill me-2" style={{ color: "#ffc451" }}></i>Rewards History
                            </h5>
                            <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "4px 0 0" }}>
                                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} total
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                onClick={exportTransactionsCSV}
                                disabled={transactions.length === 0}
                                title="Export as CSV"
                                style={{
                                    background: transactions.length === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,196,81,0.15)",
                                    border: `1px solid ${transactions.length === 0 ? "rgba(255,255,255,0.1)" : "#ffc451"}`,
                                    color: transactions.length === 0 ? "#64748b" : "#ffc451",
                                    borderRadius: "10px", padding: "6px 14px",
                                    fontSize: "0.75rem", fontWeight: 700, cursor: transactions.length === 0 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                                }}
                            >
                                <i className="bi bi-download"></i> Export CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTxOffcanvas(false)}
                                aria-label="Close"
                                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "8px", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.85rem" }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Search + Filters inside header */}
                    <div className="mt-3 position-relative">
                        <i className="bi bi-search position-absolute" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.82rem", pointerEvents: "none" }}></i>
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={txSearch}
                            onChange={(e) => setTxSearch(e.target.value)}
                            style={{ width: "100%", paddingLeft: "34px", paddingRight: txSearch ? "34px" : "12px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                        />
                        {txSearch && (
                            <button onClick={() => setTxSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}>
                                <i className="bi bi-x-lg" style={{ fontSize: "0.8rem" }}></i>
                            </button>
                        )}
                    </div>

                    <div className="d-flex gap-2 mt-3" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: "2px" }}>
                        {["All", "Earned", "Used", "Redemption"].map(f => (
                            <button
                                key={f}
                                onClick={() => setTxFilter(f)}
                                style={{
                                    flexShrink: 0, border: "none", borderRadius: "20px",
                                    padding: "4px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                    background: txFilter === f ? "#ffc451" : "rgba(255,255,255,0.1)",
                                    color: txFilter === f ? "#1a1a2e" : "#94a3b8",
                                }}
                            >{f}</button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", background: "#f8fafc" }}>
                    {loadingTransactions ? (
                        <div className="d-flex flex-column gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "1rem", border: "1px solid #e2e8f0" }}>
                                    <div className="placeholder-glow mb-2"><span className="placeholder col-5 rounded" style={{ height: 16 }}></span></div>
                                    <div className="placeholder-glow"><span className="placeholder col-3 rounded" style={{ height: 12 }}></span></div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.filter(tx => {
                        const q = txSearch.toLowerCase().trim();
                        if (q) {
                            const dateStr = new Date(tx.createdAt).toLocaleDateString().toLowerCase();
                            if (!tx.orderNo.toLowerCase().includes(q) && !dateStr.includes(q)) return false;
                        }
                        if (txFilter === "Earned") return tx.rewardsEarned > 0;
                        if (txFilter === "Used") return tx.rewardsUsed > 0 && !tx.orderNo.toLowerCase().includes("redemption");
                        if (txFilter === "Redemption") return tx.orderNo.toLowerCase().includes("redemption");
                        return true;
                    }).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
                            <i className="bi bi-clock-history" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem", opacity: 0.3 }}></i>
                            <p style={{ fontWeight: 600, margin: 0 }}>{txSearch ? `No results for "${txSearch}"` : "No transactions found."}</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {transactions
                                .filter(tx => {
                                    const q = txSearch.toLowerCase().trim();
                                    if (q) {
                                        const dateStr = new Date(tx.createdAt).toLocaleDateString().toLowerCase();
                                        if (!tx.orderNo.toLowerCase().includes(q) && !dateStr.includes(q)) return false;
                                    }
                                    if (txFilter === "Earned") return tx.rewardsEarned > 0;
                                    if (txFilter === "Used") return tx.rewardsUsed > 0 && !tx.orderNo.toLowerCase().includes("redemption");
                                    if (txFilter === "Redemption") return tx.orderNo.toLowerCase().includes("redemption");
                                    return true;
                                })
                                .map(tx => {
                                    const isRedemption = tx.orderNo.toLowerCase().includes("redemption");
                                    const isEarned = tx.rewardsEarned > 0;
                                    
                                    return (
                                        <div key={tx.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                            <div className="d-flex justify-content-between align-items-center gap-3">
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        {isRedemption ? (
                                                            <i className="bi bi-arrow-up-right-circle-fill text-danger" style={{ fontSize: "1rem" }}></i>
                                                        ) : isEarned ? (
                                                            <i className="bi bi-plus-circle-fill text-success" style={{ fontSize: "1rem" }}></i>
                                                        ) : (
                                                            <i className="bi bi-dash-circle-fill text-warning" style={{ fontSize: "1rem" }}></i>
                                                        )}
                                                        {tx.orderNo}
                                                    </div>
                                                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px" }}>
                                                        <i className="bi bi-calendar3 me-1"></i>
                                                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                                                        <span className="ms-2">
                                                            <span className={`badge ${tx.status === 'Completed' ? 'bg-success' : 'bg-warning'} px-2 py-1`} style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                                                {tx.status}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    {tx.rewardsEarned > 0 && (
                                                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#16a34a" }}>+₹{tx.rewardsEarned.toFixed(2)}</div>
                                                    )}
                                                    {tx.rewardsUsed > 0 && (
                                                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#dc2626" }}>-₹{tx.rewardsUsed.toFixed(2)}</div>
                                                    )}
                                                    <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600 }}>Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                </div>
            </div>

            {showTxOffcanvas && (
                <div className="offcanvas-backdrop fade show" onClick={() => setShowTxOffcanvas(false)}></div>
            )}

            {/* Gift Voucher Detail Modal */}
            {viewingVoucher && (
                <div 
                    className="modal show d-block" 
                    tabIndex={-1} 
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1060 }}
                    onClick={() => setViewingVoucher(null)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-content border-0 bg-transparent">
                            <div className="modal-body p-0">
                                <div className="giftcard-wrapper border shadow-lg" style={{ width: "100%" }}>
                                    <div className="giftcard-inner">
                                        <div className="giftcard-pattern"></div>
                                        <div className="giftcard-content">
                                            <div className="d-flex justify-content-between align-items-start mb-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="giftcard-icon">
                                                        <i className="bi bi-card-heading"></i>
                                                    </div>
                                                    <div className="giftcard-title">HallMark E-Gift Voucher</div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`giftcard-status ${viewingVoucher.status === 'Active' ? 'active' : 'inactive'}`}>
                                                        {viewingVoucher.status}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        className="btn-close btn-close-white" 
                                                        onClick={() => setViewingVoucher(null)}
                                                        style={{ fontSize: "0.75rem" }}
                                                    ></button>
                                                </div>
                                            </div>

                                            <div className="row align-items-end mb-4">
                                                <div className="col-8">
                                                    <div className="giftcard-label mb-1">VOUCHER CODE</div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <code className="giftcard-code">{viewingVoucher.code}</code>
                                                        <button 
                                                            className="giftcard-copy-btn"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(viewingVoucher.code);
                                                                setCopiedId(viewingVoucher.id);
                                                                setTimeout(() => setCopiedId(null), 2000);
                                                            }}
                                                            title="Copy Code"
                                                        >
                                                            {copiedId === viewingVoucher.id ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-4 text-end">
                                                    <div className="giftcard-label mb-1">BALANCE</div>
                                                    <h3 className="giftcard-balance mb-0">₹{viewingVoucher.balance.toLocaleString()}</h3>
                                                </div>
                                            </div>

                                            <div className="giftcard-footer d-flex justify-content-between align-items-center">
                                                <div className="small text-white-50">
                                                    <strong>Value:</strong> ₹{viewingVoucher.amount?.toLocaleString()}
                                                </div>
                                                <div className="small text-white-50">
                                                    <i className="bi bi-calendar-event me-1"></i>
                                                    {viewingVoucher.expiryDate ? `Expires: ${new Date(viewingVoucher.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}` : 'No Expiry'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

                /* Premium Gift Voucher Card Styles */
                .giftcard-wrapper {
                    border-radius: 20px;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: white;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                }
                .giftcard-inner {
                    padding: 2rem;
                    position: relative;
                    z-index: 1;
                }
                .giftcard-pattern {
                    position: absolute;
                    top: -50px;
                    right: -20px;
                    width: 200px;
                    height: 200px;
                    background: radial-gradient(circle, rgba(255, 196, 81, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    z-index: 0;
                }
                .giftcard-content {
                    position: relative;
                    z-index: 2;
                }
                .giftcard-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: rgba(255, 196, 81, 0.15);
                    color: #ffc451;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1);
                }
                .giftcard-title {
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    color: #f8fafc;
                }
                .giftcard-status {
                    padding: 4px 12px;
                    border-radius: 30px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .giftcard-status.active {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }
                .giftcard-status.inactive {
                    background: rgba(148, 163, 184, 0.15);
                    color: #94a3b8;
                    border: 1px solid rgba(148, 163, 184, 0.3);
                }
                .giftcard-label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 1px;
                }
                .giftcard-code {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #ffc451;
                    letter-spacing: 2px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 8px 18px;
                    border-radius: 10px;
                    display: inline-block;
                    border: 1px dashed rgba(255, 196, 81, 0.4);
                    text-shadow: 0 0 10px rgba(255, 196, 81, 0.3);
                }
                .giftcard-copy-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.07);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .giftcard-copy-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                .giftcard-balance {
                    color: #4ade80;
                    font-weight: 800;
                }
                .giftcard-footer {
                    margin-top: 2rem;
                    padding-top: 1.25rem;
                    border-top: 1px dashed rgba(255, 255, 255, 0.1);
                }

                .voucher-mini-box {
                    flex: 1;
                    min-width: 240px;
                    max-width: 280px;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .voucher-mini-box:hover {
                    transform: translateY(-4px);
                    border-color: #ffc451;
                    box-shadow: 0 8px 24px rgba(255, 196, 81, 0.12);
                }
                .mini-box-icon {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #ffc451;
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s ease;
                }
                .voucher-mini-box:hover .mini-box-icon {
                    background: linear-gradient(135deg, #ffc451, #f8a623);
                    color: white;
                    border-color: transparent;
                }
                .mini-box-content {
                    flex: 1;
                    min-width: 0;
                }
                .mini-box-code {
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: #1e293b;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .mini-box-balance {
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: #16a34a;
                    margin-top: 1px;
                }
                .mini-box-badge {
                    position: absolute;
                    top: 10px;
                    right: 12px;
                    font-size: 0.6rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 8px;
                    border-radius: 99px;
                    background: #f1f5f9;
                    color: #64748b;
                }
                .mini-box-hover {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 700;
                    opacity: 0;
                    transition: opacity 0.25s ease;
                }
                .voucher-mini-box:hover .mini-box-hover {
                    opacity: 1;
                }

                .voucher-mini-box.is-disabled {
                    cursor: not-allowed;
                    opacity: 0.7;
                    filter: grayscale(0.5);
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
                .voucher-mini-box.is-disabled:hover {
                    transform: none;
                    box-shadow: none;
                    border-color: #e2e8f0;
                }
                .voucher-mini-box.is-disabled .mini-box-icon {
                    background: #f1f5f9;
                    color: #94a3b8;
                }
                .voucher-mini-box.is-disabled .mini-box-hover {
                    cursor: not-allowed;
                }
                    .tier-demo-box { min-width: 80px; padding: 0.75rem; }
                    .tier-arrow { display: none; }
                    .pricing-tier-demo { gap: 0.5rem; }
                }
            `}</style>
        </>
    );
}
