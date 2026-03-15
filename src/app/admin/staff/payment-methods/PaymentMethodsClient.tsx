"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deletePaymentMethod, setPaymentMethodStatus } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

interface PaymentMethod {
    id: string;
    name: string;
    summary: string;
    status?: "active" | "disabled";
}

interface PaymentMethodsClientProps {
    initialPaymentMethods: PaymentMethod[];
}

export default function PaymentMethodsClient({ initialPaymentMethods }: PaymentMethodsClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const router = useRouter();

    useEffect(() => {
        const updateItemsPerPage = () => {
            const count = window.innerWidth >= 1540 ? 8 : 6;
            setItemsPerPage((prev) => {
                if (prev !== count) setCurrentPage(1);
                return count;
            });
        };
        updateItemsPerPage();
        window.addEventListener("resize", updateItemsPerPage);
        return () => window.removeEventListener("resize", updateItemsPerPage);
    }, []);

    const { showToast, ToastComponent } = useAdminToast();

    const filtered = initialPaymentMethods.filter((pm) =>
        pm.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        const result = await deletePaymentMethod(id);
        setIsDeleting(null);

        if (result.success) {
            showToast("Payment method deleted successfully");
            router.refresh();
        } else {
            showToast(result.error || "Failed to delete payment method", "error");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
        const nextStatus = currentStatus === "active" ? "disabled" : "active";
        setTogglingStatusId(id);
        const result = await setPaymentMethodStatus(id, nextStatus);
        setTogglingStatusId(null);
        if (result.success) {
            showToast(nextStatus === "disabled" ? "Payment method disabled" : "Payment method enabled");
            router.refresh();
        } else {
            showToast(result.error || "Failed to update status", "error");
        }
    };

    return (
        <div className="payment-methods-container">
            {ToastComponent}

            {isDeleting && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <div className="modal-icon warning">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h3>Are you sure?</h3>
                        <p>This action cannot be undone. You are about to delete this payment method.</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
                            <button className="delete-btn" onClick={() => handleDelete(isDeleting)}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pm-header">
                <div className="header-info">
                    <h3>Payment Methods</h3>
                    <p>Manage payment options (cards, UPI, etc.) and their logos.</p>
                </div>
                <button
                    className="add-pm-btn"
                    onClick={() => router.push("/admin/staff/payment-methods/add")}
                    style={{ textDecoration: "none" }}
                >
                    <i className="bi bi-plus-lg"></i>
                    Add New Payment Method
                </button>
            </div>

            <div className="table-actions">
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search payment methods..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="pm-grid">
                {currentItems.map((pm) => (
                    <div key={pm.id} className="pm-card">
                        <div className="pm-card-header">
                            <div className="pm-logo">
                                <div className="no-image"><i className="bi bi-credit-card"></i></div>
                            </div>
                            <div className="pm-actions">
                                <button
                                    className="icon-btn"
                                    title="Edit"
                                    onClick={() => router.push(`/admin/staff/payment-methods/edit/${pm.id}`)}
                                >
                                    <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                    className={`icon-btn ${(pm.status ?? "active") === "active" ? "disable" : "enable"}`}
                                    title={(pm.status ?? "active") === "active" ? "Disable" : "Enable"}
                                    onClick={() => handleToggleStatus(pm.id, (pm.status ?? "active") as "active" | "disabled")}
                                    disabled={togglingStatusId === pm.id}
                                >
                                    <i className={`bi ${(pm.status ?? "active") === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                                </button>
                                <button
                                    className="icon-btn delete"
                                    title="Delete"
                                    onClick={() => setIsDeleting(pm.id)}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div className="pm-body">
                            <h4>{pm.name}</h4>
                            <span className={`pm-status-pill ${(pm.status ?? "active") === "active" ? "active" : "disabled"}`}>
                                {(pm.status ?? "active") === "active" ? "Active" : "Disabled"}
                            </span>
                            <p>{pm.summary}</p>
                        </div>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pager-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="pager-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease-out;
                }
                .confirm-modal {
                    background: #fff;
                    padding: 2.5rem;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                }
                .modal-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    margin: 0 auto 1.5rem;
                }
                .modal-icon.warning { background: #fff7ed; color: #f97316; }
                .confirm-modal h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #0f172a; }
                .confirm-modal p { color: #64748b; margin-bottom: 2rem; line-height: 1.5; }
                .modal-actions { display: flex; gap: 1rem; }
                .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
                .cancel-btn:hover { background: #f1f5f9; }
                .delete-btn { background: #ef4444; border: none; color: #fff; }
                .delete-btn:hover { background: #dc2626; transform: translateY(-2px); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .pm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0 0 0.25rem 0; color: #0f172a; }
                .header-info p { color: #64748b; margin: 0; }
                .add-pm-btn {
                    display: flex !important; align-items: center !important; gap: 0.5rem !important;
                    padding: 10px 24px !important; background: #ffc451 !important; color: #ffffff !important;
                    border-radius: 12px !important; font-weight: 700 !important; cursor: pointer !important;
                    transition: all 0.3s !important; border: none !important; line-height: 1 !important;
                    font-size: 0.95rem !important; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25) !important;
                }
                .add-pm-btn:hover {
                    background: #f8b42d !important; color: #ffffff !important;
                    transform: translateY(-2px) !important; box-shadow: 0 6px 15px rgba(255, 196, 81, 0.35) !important;
                }
                .table-actions { margin-bottom: 2rem; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input {
                    width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
                    border-radius: 12px; border: 1px solid #e2e8f0; background: #fff;
                }
                .pm-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .pm-card {
                    background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.5rem; transition: all 0.3s;
                }
                .pm-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
                .pm-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                .pm-logo {
                    width: 60px; height: 60px; background: #f8fafc; border-radius: 12px; padding: 0.5rem;
                    display: flex; align-items: center; justify-content: center; overflow: hidden;
                }
                .no-image {
                    width: 100%; height: 100%; background: #f1f5f9; color: #64748b;
                    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
                }
                .pm-actions { display: flex; gap: 0.5rem; }
                .icon-btn {
                    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #f1f5f9;
                    background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .icon-btn:hover { background: #38bdf8; color: #fff; border-color: #38bdf8; }
                .icon-btn.disable {
                    background: #fff7ed; color: #ea580c; border-color: #fff7ed;
                }
                .icon-btn.enable {
                    background: #f0fdf4; color: #16a34a; border-color: #f0fdf4;
                }
                .icon-btn.disable:hover { background: #ea580c; color: #fff; border-color: #ea580c; }
                .icon-btn.enable:hover { background: #16a34a; color: #fff; border-color: #16a34a; }
                .icon-btn.delete:hover { background: #ef4444; border-color: #ef4444; }
                .pm-status-pill {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                .pm-status-pill.active { background: #dcfce7; color: #166534; }
                .pm-status-pill.disabled { background: #f1f5f9; color: #64748b; }
                .pm-body h4 { margin: 0 0 0.25rem 0; font-size: 1.125rem; color: #0f172a; }
                .pm-body p {
                    font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 0;
                    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
                }
                .pagination {
                    display: flex; justify-content: center; align-items: center; gap: 0.5rem;
                    margin-top: 3rem; padding-bottom: 2rem; flex-wrap: wrap;
                }
                .pager-btn {
                    min-width: 40px; height: 40px; padding: 0 0.5rem; border-radius: 10px;
                    border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 600;
                    display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
                    transition: 0.2s; flex-shrink: 0;
                }
                .pager-btn:hover:not(:disabled) { border-color: #ffc451; color: #ffc451; }
                .pager-btn.active { background: #ffc451; border-color: #ffc451; color: #fff; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25); }
                .pager-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
                @media (max-width: 480px) {
                    .pagination { gap: 0.25rem; }
                    .pager-btn { min-width: 34px; height: 34px; font-size: 0.8125rem; border-radius: 8px; }
                }

                @media (max-width: 768px) {
                  .pm-header { flex-direction: column; align-items: stretch; gap: 1rem; }
                  .header-info { text-align: center; }
                  .add-pm-btn { justify-content: center; }
                  .search-box { max-width: none; }
                  .pm-grid { grid-template-columns: 1fr; }
                  .pm-card { padding: 1.25rem; }
                }
            `}</style>
        </div>
    );
}
