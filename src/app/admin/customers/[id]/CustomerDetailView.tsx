"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

interface CustomerDetailViewProps {
    data: {
        customer: any;
        orders: any[];
    };
}

export default function CustomerDetailView({ data }: CustomerDetailViewProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "orders">("overview");
    const { customer, orders } = data;

    const totalSpent = orders.reduce((sum, o) => {
        const val = parseFloat(o.total?.replace(/[^\d.-]/g, '') || "0");
        return sum + val;
    }, 0);

    return (
        <div className="client-detail-container">
            <div className="detail-header">
                <div className="header-left">
                    <Link href="/admin/customers" className="back-btn">
                        <i className="bi bi-arrow-left"></i>
                    </Link>
                    <div className="client-title">
                        <div className="avatar-large">
                            {customer.firstName?.[0]?.toUpperCase() || customer.email?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                            <h1>{customer.firstName} {customer.lastName}</h1>
                            <p className="subtitle">{customer.email} • Customer since {format(new Date(customer.createdAt), "MMM yyyy")}</p>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    {customer.subscribed ? (
                        <span className="badge bg-success" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8125rem' }}>
                            <i className="bi bi-check-circle-fill me-2"></i>Newsletter Subscribed
                        </span>
                    ) : (
                        <span className="badge bg-light text-muted" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8125rem' }}>
                            Not Subscribed
                        </span>
                    )}
                </div>
            </div>

            <div className="quick-stats">
                <div className="stat-card">
                    <div className="stat-icon orders">
                        <i className="bi bi-bag-check"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Orders</span>
                        <span className="value">{orders.length}</span>
                        <span className="sub">Lifetime Orders</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon spend">
                        <i className="bi bi-cash-stack"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Total Spent</span>
                        <span className="value">₹{totalSpent.toLocaleString()}</span>
                        <span className="sub">Net Revenue</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon activity">
                        <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="stat-info">
                        <span className="label">Last Activity</span>
                        <span className="value">{customer.updatedAt ? format(new Date(customer.updatedAt), "MMM dd") : "—"}</span>
                        <span className="sub">Recent Update</span>
                    </div>
                </div>
            </div>

            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <i className="bi bi-person-circle"></i> Customer Profile
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <i className="bi bi-clock-history"></i> Purchase History
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="info-grid">
                            <div className="info-section">
                                <h3>Contact Information</h3>
                                <div className="info-rows">
                                    <div className="info-row">
                                        <span className="info-label">Full Name</span>
                                        <span className="info-val">{customer.firstName} {customer.lastName}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Email</span>
                                        <span className="info-val">{customer.email}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Phone</span>
                                        <span className="info-val">{customer.phone || "—"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="info-section">
                                <h3>Delivery Address</h3>
                                <div className="info-rows">
                                    <div className="info-row">
                                        <span className="info-label">Address</span>
                                        <span className="info-val">{customer.address || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">City</span>
                                        <span className="info-val">{customer.city || "—"}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Zip</span>
                                        <span className="info-val">{customer.zip || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="table-wrapper">
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan={6} className="empty-state">No purchases recorded yet.</td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id}>
                                            <td className="fw-bold">{order.orderNo}</td>
                                            <td>{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                                            <td className="fw-bold">{order.total}</td>
                                            <td>
                                                <span className={`status-pill mini status-${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`payment-dot ${order.paymentStatus === 'Paid' ? 'paid' : 'pending'}`}></span>
                                                {order.paymentStatus}
                                            </td>
                                            <td>
                                                <Link href={`/admin/orders/${order.id}`} className="view-link">
                                                    View Order
                                                </Link>
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
                .avatar-large { width: 64px; height: 64px; border-radius: 18px; background: #f0fdf4; color: #166534; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; border: 2px solid #dcfce7; }
                .client-title h1 { margin: 0; font-size: 1.75rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
                .subtitle { margin: 0; color: #94a3b8; font-weight: 600; font-size: 0.9375rem; margin-top: 0.25rem; }

                .quick-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background: #fff; padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                .stat-icon.orders { background: #eff6ff; color: #3b82f6; }
                .stat-icon.spend { background: #f0fdf4; color: #16a34a; }
                .stat-icon.activity { background: #f5f3ff; color: #7c3aed; }
                
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

                .status-pill { padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 700; font-size: 0.7rem; }
                .status-shipped { background: #e0f2fe; color: #0369a1; }
                .status-delivered { background: #dcfce7; color: #15803d; }
                .status-processing { background: #fef9c3; color: #a16207; }

                .payment-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 0.5rem; }
                .payment-dot.paid { background: #22c55e; }
                .payment-dot.pending { background: #f59e0b; }

                .table-wrapper { background: #fff; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
                .detail-table { width: 100%; border-collapse: collapse; }
                .detail-table th { padding: 1.25rem; background: #fafafa; text-align: left; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
                .detail-table td { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9375rem; }
                
                .view-link { color: #3b82f6; font-weight: 700; text-decoration: none; border-bottom: 2px solid transparent; transition: 0.2s; }
                .view-link:hover { border-color: #3b82f6; }
                
                .empty-state { text-align: center; padding: 3rem; color: #94a3b8; font-style: italic; }
                .fw-bold { font-weight: 700; }

                @media (max-width: 768px) {
                    .client-detail-container { padding: 1rem; }
                    .detail-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .header-left { align-items: flex-start; }
                    .client-title h1 { font-size: 1.4rem; }
                    .avatar-large { width: 52px; height: 52px; font-size: 1.4rem; }
                    
                    .tab-navigation { width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.25rem; }
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
