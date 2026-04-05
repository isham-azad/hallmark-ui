"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { voidVoucher } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

interface GiftVoucher {
    id: string;
    code: string;
    amount: number;
    balance: number;
    b2bClientUsername: string;
    b2bClientCompany: string;
    status: string;
    createdAt: string;
    expiryDate: string | null;
}

export default function VouchersClient({ initialVouchers }: { initialVouchers: GiftVoucher[] }) {
    const [vouchers, setVouchers] = useState(initialVouchers);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast, ToastComponent } = useAdminToast();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Custom Modal State
    const [voidModal, setVoidModal] = useState<string | null>(null);

    const filteredVouchers = vouchers.filter(v => 
        v.b2bClientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.b2bClientUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleVoidVoucher = async (id: string) => {
        setLoadingId(id);
        const res = await voidVoucher(id);
        if (res.success) {
            setVouchers(prev => prev.map(v => v.id === id ? { ...v, status: 'Void' } : v));
            showToast("Voucher voided successfully", "success");
        } else {
            showToast("Failed to void voucher", "error");
        }
        setLoadingId(null);
        setVoidModal(null);
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "Active": return "status-success";
            case "Exhausted": return "status-info";
            case "Void": return "status-danger";
            case "Expired": return "status-warning";
            default: return "status-pending";
        }
    };

    return (
        <div className="rewards-container">
            {ToastComponent}

            <div className="rewards-header">
                <div className="header-info">
                    <h3>E-Gift Vouchers</h3>
                    <p>Track and manage generated gift vouchers for B2B clients.</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search Client or Code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive d-none d-md-block">
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Created At</th>
                                <th style={{ width: '180px' }}>Client</th>
                                <th style={{ width: '150px' }}>Voucher Code</th>
                                <th style={{ width: '120px' }}>Amount</th>
                                <th style={{ width: '120px' }}>Balance</th>
                                <th style={{ width: '120px' }}>Expiry</th>
                                <th style={{ width: '120px' }}>Status</th>
                                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVouchers.length > 0 ? (
                                paginatedVouchers.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <div className="date-cell">
                                                <span className="date-main">{format(new Date(v.createdAt), 'dd MMM yyyy')}</span>
                                                <span className="date-sub">{format(new Date(v.createdAt), 'hh:mm aa')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="client-cell">
                                                <span className="client-company">{v.b2bClientCompany}</span>
                                                <span className="client-id">@{v.b2bClientUsername}</span>
                                            </div>
                                        </td>
                                        <td><code className="voucher-code">{v.code}</code></td>
                                        <td className="amount-cell fw-bold">₹{v.amount.toLocaleString()}</td>
                                        <td className="amount-cell">
                                            <span className={v.balance > 0 ? "text-success fw-bold" : "text-muted"}>
                                                ₹{v.balance.toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            {v.expiryDate ? (
                                                <span className="expiry-date">{format(new Date(v.expiryDate), 'dd MMM yyyy')}</span>
                                            ) : '-'}
                                        </td>
                                        <td><span className={`status-badge ${getStatusClass(v.status)}`}>{v.status}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            {v.status === 'Active' && v.balance > 0 && (
                                                <button 
                                                    className="btn-action void" 
                                                    onClick={() => setVoidModal(v.id)}
                                                    title="Void Voucher"
                                                >
                                                    <i className="bi bi-slash-circle"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-5 text-muted">No gift vouchers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="vouchers-cards-mobile d-md-none">
                    {paginatedVouchers.length > 0 ? (
                        paginatedVouchers.map((v) => (
                            <div key={v.id} className="voucher-mobile-card">
                                <div className="voucher-card-header">
                                    <div className="voucher-date-wrap">
                                        <span className="v-d">{format(new Date(v.createdAt), 'dd MMM yyyy')}</span>
                                        <span className="v-t">{format(new Date(v.createdAt), 'hh:mm aa')}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(v.status)} text-uppercase`}>{v.status}</span>
                                </div>
                                <div className="voucher-card-body">
                                    <div className="v-client-info">
                                        <span className="v-company">{v.b2bClientCompany}</span>
                                        <span className="v-username">@{v.b2bClientUsername}</span>
                                    </div>
                                    <div className="v-code-block">
                                        <code className="voucher-code">{v.code}</code>
                                    </div>
                                    <div className="v-financials">
                                        <div className="v-fin-item">
                                            <span className="v-label">Amount</span>
                                            <span className="v-val">₹{v.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="v-fin-item">
                                            <span className="v-label">Balance</span>
                                            <span className={`v-val-balance ${v.balance > 0 ? 'active' : ''}`}>₹{v.balance.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {v.expiryDate && (
                                        <div className="v-expiry-row">
                                            <i className="bi bi-calendar-event"></i>
                                            <span>Expires: {format(new Date(v.expiryDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    )}
                                </div>
                                {v.status === 'Active' && v.balance > 0 && (
                                    <div className="voucher-card-footer">
                                        <button className="mob-void-btn" onClick={() => setVoidModal(v.id)}>
                                            <i className="bi bi-slash-circle"></i> Void Voucher
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted">No gift vouchers found.</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="rewards-pagination">
                        <p className="pagination-info">Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredVouchers.length)} of {filteredVouchers.length} vouchers</p>
                        <div className="pagination-buttons">
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="page-btn"
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                            <span className="page-current">Page {currentPage} of {totalPages}</span>
                            <button 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="page-btn"
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Void Confirmation Modal */}
            {voidModal && (
                <div className="rewards-modal-overlay">
                    <div className="rewards-modal">
                        <div className="modal-icon warning">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>
                        <h3>Void Voucher?</h3>
                        <p>This will permanently disable this voucher and prevent it from being used at checkout. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setVoidModal(null)} disabled={!!loadingId}>Cancel</button>
                            <button 
                                className="btn-danger" 
                                onClick={() => handleVoidVoucher(voidModal)}
                                disabled={!!loadingId}
                            >
                                {loadingId === voidModal ? 'Voiding...' : 'Yes, Void Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .rewards-container {
                    padding: 24px;
                    width: 100%;
                }
                .rewards-header {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .header-info h3 {
                    font-weight: 700;
                    font-size: 1.5rem;
                    color: #0f172a;
                    margin-bottom: 4px;
                }
                .header-info p {
                    color: #64748b;
                    margin: 0;
                }
                .table-card {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }
                .table-actions {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .search-box {
                    max-width: 350px;
                    position: relative;
                }
                @media (max-width: 768px) {
                    .rewards-container { padding: 1.25rem 1rem; }
                    .rewards-header { flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 2rem; }
                    .header-info h3 { font-size: 1.75rem; font-weight: 800; }
                    
                    .table-card { background: transparent; border: none; box-shadow: none; overflow: visible; }
                    .table-actions { padding: 0; margin-bottom: 1.5rem; }
                    .search-box { max-width: 100%; }

                    .vouchers-cards-mobile { display: grid; grid-template-columns: 1fr; gap: 1rem; background: transparent; padding: 0; }
                    .voucher-mobile-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .voucher-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #f1f5f9; }
                    .voucher-date-wrap { display: flex; flex-direction: column; }
                    .v-d { font-weight: 800; color: #0f172a; font-size: 0.875rem; }
                    .v-t { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    
                    .voucher-card-body { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
                    .v-client-info { display: flex; flex-direction: column; }
                    .v-company { font-weight: 700; color: #1e293b; font-size: 0.9375rem; }
                    .v-username { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                    
                    .v-code-block { background: #f1f5f9; border-radius: 10px; padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0; }
                    .v-code-block .voucher-code { background: transparent; border: none; padding: 0; font-size: 1.1rem; }
                    
                    .v-financials { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 12px; }
                    .v-fin-item { display: flex; flex-direction: column; }
                    .v-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .v-val { font-size: 0.9375rem; font-weight: 700; color: #1e293b; }
                    .v-val-balance { font-size: 1rem; font-weight: 800; color: #64748b; }
                    .v-val-balance.active { color: #22c55e; }
                    
                    .v-expiry-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                    .v-expiry-row i { color: #f59e0b; }
                    
                    .voucher-card-footer { padding-top: 1rem; border-top: 1px solid #f8fafc; }
                    .mob-void-btn { width: 100%; height: 44px; border-radius: 12px; background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.875rem; }
                    .mob-void-btn:active { transform: scale(0.98); background: #fee2e2; }

                    .rewards-pagination { flex-direction: column; gap: 1rem; text-align: center; padding: 1.25rem; }
                }
                .search-box i {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-box input {
                    width: 100%;
                    padding: 10px 16px 10px 42px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }
                .search-box input:focus {
                    outline: none;
                    border-color: #ffc451;
                }
                .table-responsive {
                    width: 100%;
                    overflow-x: auto;
                }
                .rewards-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .rewards-table th {
                    background: #f8fafc;
                    padding: 14px 24px;
                    text-align: left;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    border-bottom: 1px solid #f1f5f9;
                }
                .rewards-table td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f8fafc;
                    vertical-align: middle;
                }
                .date-cell .date-main {
                    display: block;
                    font-weight: 600;
                    color: #1e293b;
                }
                .date-cell .date-sub {
                    display: block;
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-top: 2px;
                }
                .client-cell .client-company {
                    display: block;
                    font-weight: 600;
                    color: #1e293b;
                }
                .client-cell .client-id {
                    display: block;
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-top: 2px;
                }
                .voucher-code {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    background: #f1f5f9;
                    color: #475569;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    letter-spacing: 0.05em;
                    border: 1px solid #e2e8f0;
                }
                .status-badge {
                    padding: 5px 12px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-success { background: #dcfce7; color: #166534; }
                .status-info { background: #dbeafe; color: #1e40af; }
                .status-warning { background: #fef9c3; color: #854d0e; }
                .status-danger { background: #fee2e2; color: #991b1b; }
                .status-pending { background: #f1f5f9; color: #475569; }

                .btn-action {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #ef4444;
                }
                .btn-action:hover {
                    background: #fee2e2;
                    border-color: #fecaca;
                }

                /* Pagination */
                .rewards-pagination {
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }
                .pagination-info {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                }
                .pagination-buttons {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .page-btn {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                }
                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .page-btn:not(:disabled):hover {
                    border-color: #ffc451;
                    color: #ffc451;
                }
                .page-current {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #0f172a;
                }

                /* Modal Styles */
                .rewards-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }
                .rewards-modal {
                    background: #fff;
                    width: 90%;
                    max-width: 400px;
                    border-radius: 24px;
                    padding: 32px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .modal-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    font-size: 1.5rem;
                }
                .modal-icon.warning { background: #fff7ed; color: #f97316; }
                .rewards-modal h3 {
                    font-weight: 700;
                    font-size: 1.25rem;
                    margin-bottom: 12px;
                    color: #0f172a;
                }
                .rewards-modal p {
                    color: #64748b;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }
                .modal-actions {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 12px;
                }
                .btn-secondary {
                    padding: 10px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-danger {
                    padding: 10px;
                    border-radius: 12px;
                    border: none;
                    background: #ef4444;
                    color: #fff;
                    font-weight: 600;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
