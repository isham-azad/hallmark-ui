"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAdminToast } from "@/components/AdminToast";
import { B2BClient, addB2BClient, resetB2BClientPassword, toggleB2BClientStatus, deleteB2BClient } from "./actions";

interface B2BClientsClientProps {
    initialClients: B2BClient[];
}

export default function B2BClientsClient({ initialClients }: B2BClientsClientProps) {
    const [clients, setClients] = useState<B2BClient[]>(initialClients);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast, ToastComponent } = useAdminToast();
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);
    
    // Form Inputs
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        companyName: "",
        email: "",
        phone: ""
    });
    const [resetData, setResetData] = useState({
        password: ""
    });

    const filteredClients = clients.filter(c =>
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await addB2BClient(formData);
        
        if (result.success) {
            showToast("B2B Client added successfully!");
            // Temporary Optimistic Update or Refresh trigger
            window.location.reload(); 
        } else {
            showToast(result.error || "Failed to add B2B Client", "error");
        }
        setLoading(false);
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isResetModalOpen) return;
        
        setLoading(true);
        const result = await resetB2BClientPassword(isResetModalOpen, resetData.password);
        
        if (result.success) {
            showToast("Password reset successfully!");
            setIsResetModalOpen(null);
            setResetData({ password: "" });
        } else {
            showToast(result.error || "Failed to reset password", "error");
        }
        setLoading(false);
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const result = await toggleB2BClientStatus(id, currentStatus);
        
        if (result.success) {
            showToast(`Client ${result.newStatus === "active" ? "enabled" : "disabled"}`);
            setClients(prev => prev.map(c => c.id === id ? { ...c, status: result.newStatus as any } : c));
        } else {
            showToast(result.error || "Failed to update status", "error");
        }
    };

    const handleDelete = async () => {
        if (!isDeleteModalOpen) return;
        setLoading(true);
        const result = await deleteB2BClient(isDeleteModalOpen);
        
        if (result.success) {
            showToast("Client deleted permanently");
            setClients(prev => prev.filter(c => c.id !== isDeleteModalOpen));
            setIsDeleteModalOpen(null);
        } else {
            showToast(result.error || "Failed to delete client", "error");
        }
        setLoading(false);
    };

    return (
        <div className="b2b-clients-container">
            {ToastComponent}

            <div className="customers-header">
                <div className="header-info">
                    <h3>B2B Clients</h3>
                    <p>Manage your B2B clients and their login credentials.</p>
                </div>
                <button 
                    className="add-client-btn"
                    onClick={() => {
                        setFormData({ username: "", password: "", companyName: "", email: "", phone: "" });
                        setIsAddModalOpen(true);
                    }}
                >
                    <i className="bi bi-person-plus-fill"></i> Add B2B Client
                </button>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by Username, Company, Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Client Details</th>
                                <th>Contact Info</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="no-results">No B2B clients found.</td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <div className="customer-name-cell">
                                                <div className="avatar-small">
                                                    {(client.companyName?.[0] || client.username?.[0] || "-").toUpperCase()}
                                                </div>
                                                <div className="d-flex flex-column align-items-start gap-1">
                                                    <span className="customer-name">{client.companyName}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>@{client.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <span className="email"><i className="bi bi-envelope"></i> {client.email || "—"}</span>
                                                <span className="phone"><i className="bi bi-telephone"></i> {client.phone || "—"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${client.status === "active" ? "active" : "disabled"}`}>
                                                {client.status === "active" ? "Active" : "Disabled"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    type="button"
                                                    className="icon-btn edit"
                                                    title="Reset Password"
                                                    onClick={() => setIsResetModalOpen(client.id)}
                                                >
                                                    <i className="bi bi-key"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`icon-btn ${client.status === "active" ? "disable" : "enable"}`}
                                                    title={client.status === "active" ? "Disable Client" : "Enable Client"}
                                                    onClick={() => handleToggleStatus(client.id, client.status)}
                                                >
                                                    <i className={`bi ${client.status === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn delete"
                                                    title="Delete Client"
                                                    onClick={() => setIsDeleteModalOpen(client.id)}
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New B2B Client</h3>
                        <form onSubmit={handleAddSubmit}>
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input type="text" required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })} placeholder="e.g. acme_corp" />
                            </div>
                            <div className="form-group">
                                <label>Temporary Password *</label>
                                <input type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={loading}>{loading ? "Saving..." : "Save Client"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isResetModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Reset Password</h3>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Enter a new password for this client.</p>
                        <form onSubmit={handleResetSubmit}>
                            <div className="form-group">
                                <label>New Password *</label>
                                <input type="text" required value={resetData.password} onChange={e => setResetData({ password: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsResetModalOpen(null)}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="modal-icon text-danger" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>
                        <h3>Delete B2B Client?</h3>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>This action is permanent and cannot be undone.</p>
                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={() => setIsDeleteModalOpen(null)}>Cancel</button>
                            <button type="button" className="delete-btn" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete Permanently"}</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .b2b-clients-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .customers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .add-client-btn { background: #ffc451; color: #fff; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.2s; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25); }
                .add-client-btn:hover { background: #f8b42d; transform: translateY(-2px); }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }

                .customers-table { width: 100%; border-collapse: collapse; text-align: left; }
                .customers-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
                .customers-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                
                .customer-name-cell { display: flex; align-items: center; gap: 0.75rem; }
                .avatar-small { width: 36px; height: 36px; border-radius: 8px; background: #fff8eb; color: #ffc451; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 800; border: 1px solid #fff2d9; text-transform: uppercase; }
                .customer-name { font-weight: 700; color: #0f172a; font-size: 0.9375rem; }
                .text-muted { color: #64748b !important; }

                .contact-info { display: flex; flex-direction: column; gap: 0.25rem; }
                .contact-info span { font-size: 0.8125rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }

                .status-pill { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
                .status-pill.active { background: #dcfce7; color: #166534; }
                .status-pill.disabled { background: #f1f5f9; color: #64748b; }

                .no-results { padding: 3rem; text-align: center; color: #94a3b8; font-style: italic; }
                .table-responsive { overflow-x: auto; }

                .action-btns { display: flex; gap: 0.5rem; }
                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid transparent; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                .icon-btn.edit { background: #f0f9ff; color: #0369a1; }
                .icon-btn.disable { background: #fff7ed; color: #ea580c; }
                .icon-btn.enable { background: #f0fdf4; color: #16a34a; }
                .icon-btn.delete { background: #fef2f2; color: #dc2626; }
                .icon-btn:hover { background: #ffc451; color: #fff; transform: translateY(-2px); }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #fff; padding: 2rem; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                .modal-content h3 { margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
                
                .form-group { margin-bottom: 1.25rem; }
                .form-group label { display: block; font-size: 0.875rem; color: #475569; font-weight: 600; margin-bottom: 0.5rem; }
                .form-group input { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; transition: 0.2s; font-family: inherit; }
                .form-group input:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 3px rgba(255, 196, 81, 0.1); }
                
                .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end; }
                .modal-actions button { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; }
                .cancel-btn { background: #f1f5f9; color: #64748b; }
                .cancel-btn:hover { background: #e2e8f0; }
                .save-btn { background: #ffc451; color: #fff; }
                .save-btn:hover { background: #f8b42d; }
                .delete-btn { background: #ef4444; color: #fff; }
                .delete-btn:hover { background: #dc2626; }

                @media (max-width: 768px) {
                    .customers-header { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .add-client-btn { justify-content: center; }
                }
            `}</style>
        </div>
    );
}
