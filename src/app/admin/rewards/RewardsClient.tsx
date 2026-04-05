"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

const PAGE_SIZE = 10;

interface RewardTransaction {
    id: string;
    type: 'Earned' | 'Used' | 'Redeemed';
    amount: number;
    orderNo: string;
    b2bClientCompany: string;
    createdAt: string;
    status?: string;
}

export default function RewardsClient({ initialTransactions }: { initialTransactions: RewardTransaction[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredTransactions = initialTransactions.filter(t => 
        t.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.b2bClientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getStatusClass = (status: string) => {
        switch (status) {
            case "Pending": return "status-warning";
            case "Approved": return "status-info";
            case "Completed": return "status-success";
            case "Rejected": return "status-danger";
            default: return "status-pending";
        }
    };

    return (
        <div className="rewards-container">
            <div className="rewards-header">
                <div className="header-info">
                    <h3>Reward History</h3>
                    <p>Track all reward point transactions, including earnings and redemptions.</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search Order, Client, or Type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive d-none d-md-block">
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Date</th>
                                <th style={{ width: '150px' }}>Reference</th>
                                <th style={{ width: '200px' }}>B2B Client</th>
                                <th style={{ width: '120px' }}>Type</th>
                                <th style={{ width: '150px' }}>Amount</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="no-results">No reward transactions found.</td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((tx) => (
                                    <tr key={tx.id} className="reward-row">
                                        <td>
                                            <div className="date-cell">
                                                <span className="main-date">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</span>
                                                <span className="sub-time">{format(new Date(tx.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="ref-cell">
                                                <span className="order-no">{tx.orderNo}</span>
                                                {tx.status && (
                                                    <span className={`status-badge ${getStatusClass(tx.status)}`}>
                                                        {tx.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="client-name">{tx.b2bClientCompany}</span>
                                        </td>
                                        <td>
                                            <span className={`type-pill ${tx.type.toLowerCase()}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`amount-val ${tx.type === 'Earned' ? 'earned' : 'used'}`}>
                                                {tx.type === 'Earned' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td>
                                            <Link 
                                                href={`/admin/orders/${tx.id.replace('_used', '')}`} 
                                                className="view-btn"
                                            >
                                                <i className="bi bi-eye"></i> View Order
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="rewards-cards-mobile d-md-none">
                    {paginatedTransactions.length === 0 ? (
                        <div className="no-results">No reward transactions found.</div>
                    ) : (
                        paginatedTransactions.map((tx) => (
                            <div key={tx.id} className="reward-mobile-card">
                                <div className="card-header-tx">
                                    <div className="tx-date-wrap">
                                        <span className="tx-d">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</span>
                                        <span className="tx-t">{format(new Date(tx.createdAt), 'hh:mm a')}</span>
                                    </div>
                                    <span className={`type-pill ${tx.type.toLowerCase()}`}>{tx.type}</span>
                                </div>
                                <div className="card-body-tx">
                                    <div className="tx-row">
                                        <span className="tx-label">Reference</span>
                                        <span className="tx-val order-ref">{tx.orderNo}</span>
                                    </div>
                                    <div className="tx-row">
                                        <span className="tx-label">B2B Client</span>
                                        <span className="tx-val client-ref">{tx.b2bClientCompany}</span>
                                    </div>
                                    {tx.status && (
                                        <div className="tx-row">
                                            <span className="tx-label">Status</span>
                                            <span className={`status-badge ${getStatusClass(tx.status)}`}>{tx.status}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer-tx">
                                    <div className="tx-amount-section">
                                        <span className="tx-label">Amount</span>
                                        <span className={`amount-val-mobile ${tx.type === 'Earned' ? 'earned' : 'used'}`}>
                                            {tx.type === 'Earned' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <Link href={`/admin/orders/${tx.id.replace('_used', '')}`} className="mob-view-btn">
                                        <i className="bi bi-eye"></i>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                type="button"
                                className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .rewards-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .rewards-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }

                .rewards-table { width: 100%; border-collapse: collapse; text-align: left; }
                .rewards-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
                .rewards-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                
                .date-cell { display: flex; flex-direction: column; }
                .main-date { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
                .sub-time { color: #94a3b8; font-size: 0.75rem; }

                .ref-cell { display: flex; align-items: center; gap: 0.5rem; }
                .order-no { font-weight: 700; color: #ffc451; }

                .client-name { font-weight: 600; color: #475569; }

                .type-pill { padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .type-pill.earned { background: #dcfce7; color: #166534; }
                .type-pill.used { background: #fef2f2; color: #991b1b; }
                .type-pill.redeemed { background: #f0f9ff; color: #0369a1; }

                .amount-val { font-weight: 800; font-size: 1rem; }
                .amount-val.earned { color: #166534; }
                .amount-val.used { color: #991b1b; }

                .status-badge { padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
                .status-warning { background: #fffbeb; color: #92400e; }
                .status-info { background: #f0f9ff; color: #0369a1; }
                .status-success { background: #f0fdf4; color: #166534; }
                .status-danger { background: #fef2f2; color: #991b1b; }
                .status-pending { background: #f8fafc; color: #64748b; }

                .view-btn { padding: 0.5rem 1rem; background: #f8fafc; color: #0f172a; border-radius: 10px; font-size: 0.8rem; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0; transition: 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; }
                .view-btn:hover { background: #ffc451; color: #fff; border-color: #ffc451; transform: translateY(-2px); }

                .no-results { padding: 4rem; text-align: center; color: #94a3b8; font-style: italic; }

                .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #fff; }
                .pager-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
                .pager-btn:hover:not(:disabled) { border-color: #ffc451; color: #ffc451; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2); }
                .pager-btn.active { background: #ffc451; border-color: #ffc451; color: #fff; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25); }
                .pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .rewards-container { padding: 1.25rem 1rem; }
                    .rewards-header { flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 2rem; }
                    .header-info h3 { font-size: 1.75rem; font-weight: 800; }
                    
                    .table-card { background: transparent; border: none; box-shadow: none; overflow: visible; }
                    .table-actions { padding: 0; margin-bottom: 1.5rem; }
                    .search-box { max-width: 100%; }

                    .rewards-cards-mobile { display: grid; grid-template-columns: 1fr; gap: 0.75rem; padding: 0; background: transparent; }
                    .reward-mobile-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .card-header-tx { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #f1f5f9; }
                    .tx-date-wrap { display: flex; flex-direction: column; }
                    .tx-d { font-weight: 800; color: #0f172a; font-size: 0.875rem; }
                    .tx-t { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    
                    .card-body-tx { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
                    .tx-row { display: flex; justify-content: space-between; align-items: center; }
                    .tx-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .tx-val { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
                    .order-ref { color: #ffc451; font-family: monospace; }
                    
                    .card-footer-tx { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 0.75rem; border-top: 1px solid #f8fafc; }
                    .tx-amount-section { display: flex; flex-direction: column; gap: 0.25rem; }
                    .amount-val-mobile { font-size: 1.125rem; font-weight: 800; }
                    .amount-val-mobile.earned { color: #10b981; }
                    .amount-val-mobile.used { color: #ef4444; }
                    
                    .mob-view-btn { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none; border: 1px solid #e2e8f0; }
                    .mob-view-btn:active { background: #ffc451; color: #fff; transform: scale(0.95); }
                    
                    .pagination { padding: 1.25rem; gap: 0.35rem; }
                    .pager-btn { width: 36px; height: 36px; border-radius: 10px; font-size: 0.875rem; }
                }
            `}</style>
        </div>
    );
}
