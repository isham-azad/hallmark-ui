"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

interface ClientDetailViewProps {
    data: {
        client: any;
        orders: any[];
        rewards: any[];
    };
}

export default function ClientDetailView({ data }: ClientDetailViewProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "orders" | "rewards" | "ledger">("overview");
    const [ordersSearch, setOrdersSearch] = useState("");
    const [rewardsSearch, setRewardsSearch] = useState("");
    const [ledgerSearch, setLedgerSearch] = useState("");
    const { client, orders, rewards } = data;

    const totalOrdersValue = orders.reduce((sum, o) => {
        const val = parseFloat(o.total?.replace(/[^\d.-]/g, '') || "0");
        return sum + val;
    }, 0);

    let financialPending = 0;
    let financialPaid = 0;
    let financialBalance = 0;
    const financialEntries: any[] = [];
    
    [...orders]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach(data => {
            const invoiceAmount = parseFloat(data.total?.replace(/[^\d.-]/g, '') || "0");
            const isPaid = data.paymentStatus === "Paid" || data.paymentStatus === "Credit Card" || data.paymentStatus === "Tabby" || data.paymentStatus === "Stripe";
            const dateStr = data.createdAt;

            financialBalance += invoiceAmount;
            financialEntries.push({
                id: `inv-${data.id}`,
                date: dateStr,
                referenceNo: data.orderNo || `INV-${data.id.slice(0, 5)}`,
                description: `Invoice for order`,
                amount: invoiceAmount,
                type: "Debit",
                balance: financialBalance
            });

            if (isPaid) {
                financialPaid += invoiceAmount;
                financialBalance -= invoiceAmount;
                const paidDate = data.paidAt || dateStr; 
                financialEntries.push({
                    id: `pmt-${data.id}`,
                    date: paidDate,
                    referenceNo: `PMT-${data.orderNo || data.id.slice(0, 5)}`,
                    description: `Payment received via ${data.paymentMethod || data.payment || 'system'}`,
                    amount: invoiceAmount,
                    type: "Credit",
                    balance: financialBalance
                });
            } else {
                financialPending += invoiceAmount;
            }
        });
        
    financialEntries.reverse();

    const exportFinancialLedgerCSV = () => {
        if (financialEntries.length === 0) return;

        const headers = ["Reference No", "Date", "Description", "Type", "Amount", "Balance"];
        const rows = financialEntries.map(l => [
            l.referenceNo,
            format(new Date(l.date), "MMM dd, yyyy HH:mm"),
            l.description,
            l.type,
            l.amount,
            l.balance
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `client_${client.username}_ledger_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="client-detail-container">
            <div className="detail-header">
                <div className="header-left">
                    <Link href="/admin/b2b-clients" className="back-btn">
                        <i className="bi bi-arrow-left"></i>
                    </Link>
                    <div className="client-title">
                        <div className="avatar-large">
                            {client.companyName?.[0]?.toUpperCase() || client.username?.[0]?.toUpperCase() || "B"}
                        </div>
                        <div>
                            <h1>{client.companyName}</h1>
                            <p className="subtitle">@{client.username} • Joined {format(new Date(client.createdAt), "MMMM yyyy")}</p>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    <span className={`status-pill ${client.status === "active" ? "active" : "disabled"}`}>
                        {client.status === "active" ? "Active Account" : "Disabled Account"}
                    </span>
                </div>
            </div>

            <div className="quick-stats">
                <div className="stat-card">
                    <div className="stat-icon orders">
                        <i className="bi bi-cart-check"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Total Orders</span>
                        <span className="value">{orders.length}</span>
                        <span className="sub">₹{totalOrdersValue.toLocaleString()} total value</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon rewards">
                        <i className="bi bi-gift"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Reward Balance</span>
                        <span className="value">{client.rewardBalance.toLocaleString()} pts</span>
                        <span className="sub">{client.rewardPercentage}% earning rate</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon location">
                        <i className="bi bi-geo-alt"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Location</span>
                        <span className="value">{client.city || "—"}</span>
                        <span className="sub">{client.zip || "No Zip"}</span>
                    </div>
                </div>
            </div>

            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <i className="bi bi-info-circle"></i> Profile Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <i className="bi bi-list-check"></i> Orders History
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rewards')}
                >
                    <i className="bi bi-clock-history"></i> Points Ledger
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ledger')}
                >
                    <i className="bi bi-journal-text"></i> Financial Ledger
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="info-grid">
                            <div className="info-section">
                                <h3>Contact Details</h3>
                                <div className="info-rows">
                                    <div className="info-row">
                                        <span className="info-label">Full Name</span>
                                        <span className="info-val">{client.firstName} {client.lastName}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Email Address</span>
                                        <span className="info-val">{client.email || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Phone Number</span>
                                        <span className="info-val">{client.phone || "—"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="info-section">
                                <h3>Business Address</h3>
                                <div className="info-rows">
                                    <div className="info-row">
                                        <span className="info-label">Address</span>
                                        <span className="info-val">{client.address || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">City</span>
                                        <span className="info-val">{client.city || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Pincode</span>
                                        <span className="info-val">{client.zip || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="table-wrapper">
                        {/* Toolbar */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem", pointerEvents: "none" }}></i>
                                <input
                                    type="text"
                                    placeholder="Search by order no..."
                                    value={ordersSearch}
                                    onChange={e => setOrdersSearch(e.target.value)}
                                    style={{ width: "100%", height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none", background: "#f8fafc" }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const filtered = orders.filter(o => !ordersSearch || o.orderNo?.toLowerCase().includes(ordersSearch.toLowerCase()));
                                    if (!filtered.length) return;
                                    const headers = ["Order No", "Date", "Total", "Payment Status", "Delivery Status"];
                                    const rows = filtered.map(o => [o.orderNo, format(new Date(o.createdAt), "MMM dd, yyyy"), o.total, o.paymentStatus, o.status]);
                                    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
                                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a"); a.href = url; a.download = `client_${client.username}_orders_${new Date().toISOString().split("T")[0]}.csv`; a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                style={{ background: "#0f172a", border: "none", color: "#fff", borderRadius: 8, padding: "0 14px", height: 36, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                                <i className="bi bi-download"></i> Export CSV
                            </button>
                        </div>
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Total Amount</th>
                                    <th>Payment</th>
                                    <th>Delivery</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter(o => !ordersSearch || o.orderNo?.toLowerCase().includes(ordersSearch.toLowerCase())).length === 0 ? (
                                    <tr><td colSpan={6} className="empty-state">No orders found for this client.</td></tr>
                                ) : (
                                    orders.filter(o => !ordersSearch || o.orderNo?.toLowerCase().includes(ordersSearch.toLowerCase())).map(order => (
                                        <tr key={order.id}>
                                            <td className="fw-bold">{order.orderNo}</td>
                                            <td>{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                                            <td>{order.total}</td>
                                            <td>
                                                <span className={`status-pill mini ${order.paymentStatus === 'Paid' ? 'active' : 'pending'}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill mini status-${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Link href={`/admin/orders/${order.id}`} className="view-link">
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="table-wrapper">
                        {/* Toolbar */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem", pointerEvents: "none" }}></i>
                                <input
                                    type="text"
                                    placeholder="Search by type or note..."
                                    value={rewardsSearch}
                                    onChange={e => setRewardsSearch(e.target.value)}
                                    style={{ width: "100%", height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none", background: "#f8fafc" }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const q = rewardsSearch.toLowerCase();
                                    const filtered = rewards.filter(r => !q || r.type?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q));
                                    if (!filtered.length) return;
                                    const headers = ["Date", "Type", "Amount", "Note", "Status"];
                                    const rows = filtered.map(r => [format(new Date(r.createdAt), "MMM dd, yyyy HH:mm"), r.type, r.amount, r.note || "", r.status || ""]);
                                    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
                                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a"); a.href = url; a.download = `client_${client.username}_points_${new Date().toISOString().split("T")[0]}.csv`; a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                style={{ background: "#0f172a", border: "none", color: "#fff", borderRadius: 8, padding: "0 14px", height: 36, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                                <i className="bi bi-download"></i> Export CSV
                            </button>
                        </div>
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Note</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rewards.filter(r => { const q = rewardsSearch.toLowerCase(); return !q || r.type?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q); }).length === 0 ? (
                                    <tr><td colSpan={5} className="empty-state">No point transactions yet.</td></tr>
                                ) : (
                                    rewards.filter(r => { const q = rewardsSearch.toLowerCase(); return !q || r.type?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q); }).map(r => (
                                        <tr key={r.id}>
                                            <td>{format(new Date(r.createdAt), "MMM dd, yyyy HH:mm")}</td>
                                            <td>
                                                <span className={`type-tag ${r.type.toLowerCase()}`}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td className={`fw-bold ${r.type === 'Earned' ? 'text-success' : 'text-danger'}`}>
                                                {r.type === 'Earned' ? '+' : '-'}{r.amount.toLocaleString()} pts
                                            </td>
                                            <td className="text-muted small">{r.note}</td>
                                            <td>{r.status || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div className="table-wrapper">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", padding: "1.5rem", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ background: "#fff", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pending</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#d97706" }}>₹{financialPending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div style={{ background: "#fff", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Paid</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#166534" }}>₹{financialPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div style={{ background: "#fff", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Current Balance</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: financialEntries[0]?.balance > 0 ? "#dc2626" : "#2563eb" }}>₹{(financialEntries[0]?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                        {/* Toolbar */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem", pointerEvents: "none" }}></i>
                                <input
                                    type="text"
                                    placeholder="Search by reference no..."
                                    value={ledgerSearch}
                                    onChange={e => setLedgerSearch(e.target.value)}
                                    style={{ width: "100%", height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none", background: "#f8fafc" }}
                                />
                            </div>
                            {financialEntries.length > 0 && (
                                <button
                                    type="button"
                                    onClick={exportFinancialLedgerCSV}
                                    style={{ background: "#0f172a", border: "none", color: "#fff", borderRadius: 8, padding: "0 14px", height: 36, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "#0f172a"}
                                >
                                    <i className="bi bi-download"></i> Export CSV
                                </button>
                            )}
                        </div>
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Ref No</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th className="text-end">Amount</th>
                                    <th className="text-end">Run Bal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialEntries.filter(e => !ledgerSearch || e.referenceNo?.toLowerCase().includes(ledgerSearch.toLowerCase())).length === 0 ? (
                                    <tr><td colSpan={6} className="empty-state">No financial transactions yet.</td></tr>
                                ) : (
                                    financialEntries.filter(e => !ledgerSearch || e.referenceNo?.toLowerCase().includes(ledgerSearch.toLowerCase())).map(e => (
                                        <tr key={e.id}>
                                            <td>{format(new Date(e.date), "MMM dd, yyyy HH:mm")}</td>
                                            <td className="fw-bold">{e.referenceNo}</td>
                                            <td className="text-muted small">{e.description}</td>
                                            <td>
                                                <span className={`type-tag ${e.type.toLowerCase()}`} style={{ background: e.type === 'Credit' ? '#dcfce7' : '#fee2e2', color: e.type === 'Credit' ? '#166534' : '#991b1b' }}>
                                                    {e.type}
                                                </span>
                                            </td>
                                            <td className={`fw-bold text-end ${e.type === 'Debit' ? 'text-danger' : 'text-success'}`}>
                                                {e.type === 'Debit' ? '+' : '-'}₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="fw-bold text-end">
                                                ₹{e.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .client-detail-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .header-left { display: flex; align-items: center; gap: 1.5rem; }
                .back-btn { width: 44px; height: 44px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; }
                .back-btn:hover { background: #f8fafc; color: #0f172a; transform: translateX(-3px); }
                
                .client-title { display: flex; align-items: center; gap: 1.25rem; }
                .avatar-large { width: 64px; height: 64px; border-radius: 18px; background: #fff8eb; color: #ffc451; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; border: 2px solid #fff2d9; }
                .client-title h1 { margin: 0; font-size: 1.75rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
                .subtitle { margin: 0; color: #94a3b8; font-weight: 600; font-size: 0.9375rem; margin-top: 0.25rem; }

                .status-pill { padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.8125rem; }
                .status-pill.active { background: #dcfce7; color: #15803d; }
                .status-pill.disabled { background: #f1f5f9; color: #64748b; }
                .status-pill.mini { padding: 0.25rem 0.6rem; font-size: 0.7rem; }
                .status-pill.pending { background: #fef9c3; color: #a16207; }

                .quick-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background: #fff; padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                .stat-icon.orders { background: #eff6ff; color: #3b82f6; }
                .stat-icon.rewards { background: #fffbeb; color: #d97706; }
                .stat-icon.location { background: #fdf2f8; color: #db2777; }
                
                .stat-info { display: flex; flex-direction: column; }
                .stat-info .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-info .value { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0.1rem 0; }
                .stat-info .sub { font-size: 0.75rem; color: #64748b; font-weight: 600; }

                .tab-navigation { display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 16px; margin-bottom: 2rem; width: fit-content; }
                .tab-btn { padding: 0.75rem 1.5rem; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; color: #64748b; background: transparent; display: flex; align-items: center; gap: 0.6rem; }
                .tab-btn:hover { color: #0f172a; }
                .tab-btn.active { background: #fff; color: #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .info-section { background: #fff; border-radius: 24px; border: 1px solid #f1f5f9; padding: 2rem; }
                .info-section h3 { margin: 0 0 1.5rem 0; font-size: 1.125rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #ffc451; width: fit-content; padding-bottom: 0.5rem; }
                .info-rows { display: flex; flex-direction: column; gap: 1.25rem; }
                .info-row { display: flex; flex-direction: column; gap: 0.4rem; }
                .info-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .info-val { font-size: 1rem; color: #1e293b; font-weight: 600; }

                .table-wrapper { background: #fff; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
                .detail-table { width: 100%; border-collapse: collapse; }
                .detail-table th { padding: 1.25rem; background: #fafafa; text-align: left; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
                .detail-table td { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9375rem; }
                .detail-table tr:last-child td { border-bottom: none; }
                
                .type-tag { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                .type-tag.earned { background: #f0fdf4; color: #166534; }
                .type-tag.used { background: #fffaf0; color: #9a3412; }
                .type-tag.redeemed { background: #fef2f2; color: #991b1b; }

                .view-link { color: #3b82f6; font-weight: 700; text-decoration: none; border-bottom: 2px solid transparent; transition: 0.2s; }
                .view-link:hover { border-color: #3b82f6; }
                
                .empty-state { text-align: center; padding: 3rem; color: #94a3b8; font-style: italic; }
                .fw-bold { font-weight: 700; }
                .text-success { color: #10b981; }
                .text-danger { color: #ef4444; }

                @media (max-width: 768px) {
                    .client-detail-container { padding: 1rem; }
                    .detail-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-left { align-items: flex-start; }
                    .client-title h1 { font-size: 1.4rem; }
                    .avatar-large { width: 52px; height: 52px; font-size: 1.4rem; }
                    
                    .tab-navigation { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; }
                    .tab-btn { padding: 0.75rem 0.5rem; font-size: 0.7rem; flex-direction: column; gap: 0.25rem; text-align: center; }
                    .tab-btn i { font-size: 1.1rem; }

                    .info-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .info-section { padding: 1.5rem; }
                    
                    .quick-stats { grid-template-columns: 1fr; gap: 1rem; }
                    
                    .table-wrapper { overflow-x: auto; width: calc(100vw - 2rem); margin-left: -0.5rem; margin-right: -0.5rem; border-radius: 12px; }
                    .detail-table { min-width: 600px; }
                    .detail-table th, .detail-table td { padding: 0.75rem; font-size: 0.8rem; }
                }
            `}</style>
        </div>
    );
}
