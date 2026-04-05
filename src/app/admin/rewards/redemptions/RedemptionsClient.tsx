"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { updateRedemptionStatus } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

interface RedemptionRequest {
    id: string;
    b2bClientUsername: string;
    b2bClientCompany: string;
    amount: number;
    method: string;
    details: string;
    status: string;
    requestedAt: string;
}

export default function RedemptionsClient({ initialRequests }: { initialRequests: RedemptionRequest[] }) {
    const [requests, setRequests] = useState(initialRequests);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast, ToastComponent } = useAdminToast();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Custom Modal State
    const [confirmModal, setConfirmModal] = useState<{ id: string; status: string } | null>(null);

    const filteredRequests = requests.filter(r => 
        r.b2bClientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.b2bClientUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleStatusUpdate = async (id: string, status: string) => {
        setLoadingId(id);
        const res = await updateRedemptionStatus(id, status);
        if (res.success) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            showToast(`Status updated to ${status}`, "success");
        } else {
            showToast("Failed to update status", "error");
        }
        setLoadingId(null);
        setConfirmModal(null);
    };

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
            {ToastComponent}

            <div className="rewards-header">
                <div className="header-info">
                    <h3>Redemption Requests</h3>
                    <p>Manage and process payout requests from B2B clients.</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search Client or Method..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive d-none d-md-block">
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Requested At</th>
                                <th style={{ width: '180px' }}>Client</th>
                                <th style={{ width: '120px' }}>Amount</th>
                                <th style={{ width: '130px' }}>Method</th>
                                <th style={{ width: '180px' }}>Details</th>
                                <th style={{ width: '120px' }}>Status</th>
                                <th style={{ width: '140px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="no-results">No redemption requests found.</td>
                                </tr>
                            ) : (
                                paginatedRequests.map((request) => (
                                    <tr key={request.id} className="reward-row">
                                        <td>
                                            <div className="date-cell">
                                                <span className="main-date">{format(new Date(request.requestedAt), 'MMM dd, yyyy')}</span>
                                                <span className="sub-time">{format(new Date(request.requestedAt), 'hh:mm a')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="client-cell">
                                                <span className="client-name">{request.b2bClientCompany}</span>
                                                <span className="client-user">@{request.b2bClientUsername}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="amount-val redeemed">₹{request.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td>
                                            <span className="method-tag text-capitalize">{request.method.replace('_', ' ')}</span>
                                        </td>
                                        <td>
                                            <div className="details-cell" title={request.details}>
                                                {request.details}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="dropdown">
                                                <button 
                                                    className="modify-btn dropdown-toggle" 
                                                    type="button" 
                                                    data-bs-toggle="dropdown"
                                                    disabled={loadingId === request.id}
                                                >
                                                    {loadingId === request.id ? <i className="bi bi-hourglass-split"></i> : <i className="bi bi-pencil-square"></i>}
                                                    Modify Status
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2 rounded-3">
                                                    <li><button className="dropdown-item rounded-2 py-2" onClick={() => setConfirmModal({ id: request.id, status: 'Pending' })}>Pending</button></li>
                                                    <li><button className="dropdown-item rounded-2 py-2 text-success" onClick={() => setConfirmModal({ id: request.id, status: 'Approved' })}>Mark Approved</button></li>
                                                    <li><button className="dropdown-item rounded-2 py-2 text-primary" onClick={() => setConfirmModal({ id: request.id, status: 'Completed' })}>Mark Completed</button></li>
                                                    <li><button className="dropdown-item rounded-2 py-2 text-danger" onClick={() => setConfirmModal({ id: request.id, status: 'Rejected' })}>Reject Request</button></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="redemptions-cards-mobile d-md-none">
                    {paginatedRequests.length === 0 ? (
                        <div className="no-results">No redemption requests found.</div>
                    ) : (
                        paginatedRequests.map((request) => (
                            <div key={request.id} className="redemption-mobile-card">
                                <div className="red-card-header">
                                    <div className="red-date">
                                        <span className="red-d">{format(new Date(request.requestedAt), 'MMM dd, yyyy')}</span>
                                        <span className="red-t">{format(new Date(request.requestedAt), 'hh:mm a')}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(request.status)} text-uppercase`}>{request.status}</span>
                                </div>
                                <div className="red-card-body">
                                    <div className="red-client">
                                        <span className="v-company">{request.b2bClientCompany}</span>
                                        <span className="v-username">@{request.b2bClientUsername}</span>
                                    </div>
                                    <div className="red-amount-block">
                                        <span className="red-label">Payout Amount</span>
                                        <span className="red-val-hero">₹{request.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="red-info-strip">
                                        <div className="red-info-item">
                                            <span className="red-label">Method</span>
                                            <span className="red-val-sm text-capitalize">{request.method.replace('_', ' ')}</span>
                                        </div>
                                        <div className="red-info-item">
                                            <span className="red-label">Details</span>
                                            <span className="red-val-sm truncate-mobile">{request.details}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="red-card-footer">
                                    <div className="mobile-status-actions">
                                        <button className="mob-action-btn req-approved" onClick={() => setConfirmModal({ id: request.id, status: 'Approved' })}>
                                            Approve
                                        </button>
                                        <button className="mob-action-btn req-completed" onClick={() => setConfirmModal({ id: request.id, status: 'Completed' })}>
                                            Complete
                                        </button>
                                        <button className="mob-action-btn req-rejected" onClick={() => setConfirmModal({ id: request.id, status: 'Rejected' })}>
                                            Reject
                                        </button>
                                    </div>
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

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="modal-overlay">
                    <div className="confirm-modal animate-in">
                        <div className="modal-icon">
                            <i className="bi bi-exclamation-circle-fill text-warning"></i>
                        </div>
                        <h4>Confirm Status Change</h4>
                        <p>Are you sure you want to change the status to <span className={`status-badge ${getStatusClass(confirmModal.status)}`}>{confirmModal.status}</span>?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setConfirmModal(null)} disabled={loadingId === confirmModal.id}>
                                Cancel
                            </button>
                            <button className="save-btn" onClick={() => handleStatusUpdate(confirmModal.id, confirmModal.status)} disabled={loadingId === confirmModal.id}>
                                {loadingId === confirmModal.id ? "Processing..." : "Confirm Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .rewards-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .rewards-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: visible !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: relative; }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }

                .table-responsive { overflow: visible !important; min-height: 400px; padding-bottom: 50px; }
                .rewards-table { width: 100%; border-collapse: collapse; text-align: left; position: relative; }
                .rewards-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
                .rewards-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                
                .date-cell { display: flex; flex-direction: column; }
                .main-date { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
                .sub-time { color: #94a3b8; font-size: 0.75rem; }

                .client-cell { display: flex; flex-direction: column; }
                .client-name { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
                .client-user { color: #94a3b8; font-size: 0.75rem; }

                .amount-val { font-weight: 800; font-size: 1rem; color: #0369a1; }
                .method-tag { font-size: 0.8rem; color: #64748b; font-weight: 600; }
                .details-cell { font-size: 0.8rem; color: #64748b; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .status-badge { padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
                .status-warning { background: #fffbeb; color: #92400e; }
                .status-info { background: #f0f9ff; color: #0369a1; }
                .status-success { background: #f0fdf4; color: #166534; }
                .status-danger { background: #fef2f2; color: #991b1b; }
                .status-pending { background: #f8fafc; color: #64748b; }

                .dropdown { position: relative; }
                .dropdown-menu { z-index: 1060; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); margin-top: 0.5rem; }
                .modify-btn { padding: 0.5rem 1rem; background: #f8fafc; color: #0f172a; border-radius: 10px; font-size: 0.8rem; font-weight: 700; border: 1px solid #e2e8f0; transition: 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; }
                .modify-btn:hover { background: #fff; border-color: #ffc451; color: #ffc451; }

                .dropdown-item { font-weight: 600; font-size: 0.85rem; }
                .dropdown-item:hover { background: #f8fafc; }

                .no-results { padding: 4rem; text-align: center; color: #94a3b8; font-style: italic; }

                .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #fff; }
                .pager-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
                .pager-btn:hover:not(:disabled) { border-color: #ffc451; color: #ffc451; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2); }
                .pager-btn.active { background: #ffc451; border-color: #ffc451; color: #fff; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25); }
                .pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .confirm-modal { background: #fff; padding: 2.5rem; border-radius: 24px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                .modal-icon { font-size: 3rem; margin-bottom: 1rem; }
                .confirm-modal h4 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a; }
                .confirm-modal p { color: #64748b; margin-bottom: 2rem; }
                .modal-actions { display: flex; gap: 1rem; }
                .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; }
                .cancel-btn { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0 !important; }
                .save-btn { background: #ffc451; color: #fff; }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); }

                .animate-in { animation: modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes modal-in { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

                @media (max-width: 768px) {
                    .rewards-container { padding: 1.25rem 1rem; }
                    .rewards-header { flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 2rem; }
                    .header-info h3 { font-size: 1.75rem; font-weight: 800; }
                    
                    .table-card { background: transparent; border: none; box-shadow: none; overflow: visible; }
                    .table-actions { padding: 0; margin-bottom: 1.5rem; }
                    .search-box { max-width: 100%; }

                    .redemptions-cards-mobile { display: grid; grid-template-columns: 1fr; gap: 1rem; background: transparent; padding: 0; }
                    .redemption-mobile-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .red-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #f1f5f9; }
                    .red-date { display: flex; flex-direction: column; }
                    .red-d { font-weight: 800; color: #0f172a; font-size: 0.875rem; }
                    .red-t { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                    
                    .red-card-body { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
                    .red-client { display: flex; flex-direction: column; }
                    .v-company { font-weight: 700; color: #1e293b; font-size: 0.9375rem; }
                    .v-username { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                    
                    .red-amount-block { background: #f0f9ff; border-radius: 12px; padding: 1rem; border: 1px solid #e0f2fe; text-align: center; }
                    .red-label { display: block; font-size: 0.65rem; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
                    .red-val-hero { font-size: 1.5rem; font-weight: 800; color: #0369a1; }
                    
                    .red-info-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                    .red-info-item { display: flex; flex-direction: column; min-width: 0; }
                    .red-info-item .red-label { color: #94a3b8; }
                    .red-val-sm { font-size: 0.8125rem; font-weight: 700; color: #475569; }
                    .truncate-mobile { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    
                    .red-card-footer { padding-top: 1rem; border-top: 1px solid #f8fafc; }
                    .mobile-status-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
                    .mob-action-btn { height: 40px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; transition: 0.2s; background: #fff; }
                    .req-approved { border-color: #d1fae5; color: #059669; background: #ecfdf5; }
                    .req-completed { border-color: #dbeafe; color: #2563eb; background: #eff6ff; }
                    .req-rejected { border-color: #fee2e2; color: #dc2626; background: #fef2f2; }
                    .mob-action-btn:active { transform: scale(0.95); }

                    .pagination { padding: 1.25rem; font-size: 0.8rem; }
                    .pager-btn { width: 36px; height: 36px; border-radius: 10px; }
                }
            `}</style>
        </div>
    );
}
