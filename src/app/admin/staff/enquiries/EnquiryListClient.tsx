"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Enquiry, updateEnquiryStatus, deleteEnquiry } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

export default function EnquiryListClient({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
    const [enquiries, setEnquiries] = useState(initialEnquiries);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

    const toggleMessage = (id: string) => {
        const next = new Set(expandedMessages);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedMessages(next);
    };

    // Filtering logic
    const filteredEnquiries = enquiries.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.includes(searchTerm) ||
        (e.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedEnquiries = filteredEnquiries.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleUpdateStatus = async (id: string, status: string) => {
        const res = await updateEnquiryStatus(id, status);
        if (res.success) {
            showToast("Status updated", "success");
            setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        } else {
            showToast("Update failed", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this enquiry?")) return;
        const res = await deleteEnquiry(id);
        if (res.success) {
            showToast("Enquiry deleted", "success");
            setEnquiries(prev => prev.filter(e => e.id !== id));
        } else {
            showToast("Delete failed", "error");
        }
    };

    return (
        <div className="enquiry-container">
            {ToastComponent}
            <div className="enquiry-header">
                <div className="header-info">
                    <h3>Product Enquiries</h3>
                    <p>Manage customer inquiries regarding products and pricing.</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions-bar">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by name, phone or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="desktop-only-table staff-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Product Interest</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEnquiries.map((e) => {
                                const isExpanded = expandedMessages.has(e.id);
                                const shouldTruncate = e.message.length > 60;
                                
                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <div className="staff-name-cell align-items-start">
                                                <div className="avatar-circle mt-1">{e.name[0].toUpperCase()}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="name-text">{e.name}</div>
                                                    <div className="message-container mt-1">
                                                        <p className="mb-0 text-muted small" style={{ 
                                                            textAlign: 'justify',
                                                            maxWidth: '250px',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {shouldTruncate && !isExpanded 
                                                                ? `${e.message.substring(0, 60)}...` 
                                                                : e.message
                                                            }
                                                            {shouldTruncate && (
                                                                <button 
                                                                    onClick={() => toggleMessage(e.id)}
                                                                    className="btn btn-link p-0 ms-1 text-primary fw-bold"
                                                                    style={{ fontSize: '0.7rem', textDecoration: 'none' }}
                                                                >
                                                                    {isExpanded ? "Read Less" : "Read More"}
                                                                </button>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold">{e.phone}</span>
                                                {e.email && <small className="text-muted">{e.email}</small>}
                                            </div>
                                        </td>
                                        <td>
                                            {e.product ? (
                                                <div className="d-flex align-items-center gap-2">
                                                    {e.product.image && (
                                                        <img 
                                                            src={e.product.image.split(',')[0]} 
                                                            alt="" 
                                                            className="rounded"
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="fw-600 fs-xs">{e.product.name}</div>
                                                        <small className="text-muted fs-xxs">{e.product.category}</small>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted italic small">General Inquiry</span>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                value={e.status}
                                                onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                                                className={`role-select status-${e.status.toLowerCase()}`}
                                            >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Quoted">Quoted</option>
                                                <option value="Closed">Closed</option>
                                                <option value="Spam">Spam</option>
                                            </select>
                                        </td>
                                        <td>{format(new Date(e.createdAt), "MMM dd, yyyy")}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="delete-btn" onClick={() => handleDelete(e.id)} title="Delete Enquiry">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedEnquiries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="empty-state">No enquiries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mobile-only-cards staff-cards">
                        {paginatedEnquiries.map((e) => {
                            const isExpanded = expandedMessages.has(e.id);
                            const shouldTruncate = e.message.length > 100;

                            return (
                                <div className="staff-card" key={e.id}>
                                    <div className="card-header">
                                        <div className="avatar-circle">{e.name[0].toUpperCase()}</div>
                                        <div className="header-text">
                                            <div className="name-text">{e.name}</div>
                                            <div className="joined-text">{format(new Date(e.createdAt), "MMM dd, yyyy")}</div>
                                        </div>
                                        <div className="mobile-actions">
                                            <button className="delete-btn" onClick={() => handleDelete(e.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="info-item">
                                            <i className="bi bi-telephone"></i>
                                            <span>{e.phone}</span>
                                        </div>
                                        {e.product && (
                                            <div className="info-item">
                                                <i className="bi bi-box"></i>
                                                <span>{e.product.name}</span>
                                            </div>
                                        )}
                                        <div className="info-item status-item">
                                            <i className="bi bi-flag"></i>
                                            <select
                                                value={e.status}
                                                onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                                                className={`role-select mobile-role-select status-${e.status.toLowerCase()}`}
                                            >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Quoted">Quoted</option>
                                                <option value="Closed">Closed</option>
                                                <option value="Spam">Spam</option>
                                            </select>
                                        </div>
                                        <div className="p-2 bg-light rounded small mt-1">
                                            <strong>Message:</strong> {shouldTruncate && !isExpanded 
                                                                ? `${e.message.substring(0, 100)}...` 
                                                                : e.message
                                                            }
                                            {shouldTruncate && (
                                                <button 
                                                    onClick={() => toggleMessage(e.id)}
                                                    className="btn btn-link p-0 ms-1 text-primary fw-bold"
                                                    style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                                >
                                                    {isExpanded ? "Show Less" : "Read More"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-wrap">
                        <p className="pagination-info">
                            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredEnquiries.length)} of {filteredEnquiries.length}
                        </p>
                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                            <span className="pagination-pages">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .enquiry-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .enquiry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; }
                .table-actions-bar { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; background: #fff; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.9375rem; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; }

                .staff-table { width: 100%; border-collapse: collapse; }
                .staff-table th { padding: 1.25rem 1.5rem; text-align: left; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
                .staff-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

                .staff-name-cell { display: flex; align-items: center; gap: 0.75rem; }
                .avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
                .name-text { font-weight: 600; color: #0f172a; }

                .role-select { padding: 4px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; }
                
                .role-select.status-new { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
                .role-select.status-contacted { background: #fffbeb; color: #92400e; border-color: #fef3c7; }
                .role-select.status-quoted { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
                .role-select.status-closed { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
                .role-select.status-spam { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

                .action-buttons { display: flex; gap: 0.5rem; }
                .delete-btn { background: #fff; border: 1px solid #fee2e2; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .delete-btn:hover { background: #ef4444; color: #fff; }

                .pagination-wrap { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #fafbfc; border-top: 1px solid #f1f5f9; }
                .pagination-info { margin: 0; font-size: 0.875rem; color: #64748b; }
                .pagination-controls { display: flex; align-items: center; gap: 1rem; }
                .pagination-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .pagination-btn:hover:not(:disabled) { background: #ffc451; color: #fff; border-color: #ffc451; }
                .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-pages { font-size: 0.875rem; font-weight: 600; color: #475569; }

                .empty-state { text-align: center; padding: 2rem; color: #94a3b8; font-style: italic; }

                .table-responsive { overflow-x: auto; }
                .mobile-only-cards { display: none; }
                
                .fw-600 { font-weight: 600; }
                .fs-xs { font-size: 0.8rem; }
                .fs-xxs { font-size: 0.7rem; }

                @media (max-width: 768px) {
                    .desktop-only-table { display: none; }
                    .mobile-only-cards { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; background: #fafbfc; }
                    
                    .staff-card { background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #e2e8f0; position: relative; }
                    .header-text { display: flex; flex-direction: column; gap: 0.15rem; }
                    .joined-text { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .mobile-actions { position: absolute; right: 0; top: 0; display: flex; gap: 0.5rem; }
                    .mobile-actions button { width: 36px; height: 36px; }
                    
                    .card-body { display: flex; flex-direction: column; gap: 1rem; }
                    .info-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8125rem; color: #475569; font-weight: 500; }
                    .info-item i { color: #94a3b8; font-size: 0.9375rem; }
                    .status-item { align-items: center; }
                    .mobile-role-select { flex: 1; height: 36px; font-size: 0.7rem; }

                    .pagination-wrap { flex-direction: column; text-align: center; gap: 1rem; padding: 1.25rem 1rem; }
                }
            `}</style>
        </div>
    );
}
