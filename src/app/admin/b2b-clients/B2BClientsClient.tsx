"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAdminToast } from "@/components/AdminToast";
import { B2BClient, addB2BClient, editB2BClient, resetB2BClientPassword, toggleB2BClientStatus, deleteB2BClient } from "./actions";

interface B2BClientsClientProps {
    initialClients: B2BClient[];
}

export default function B2BClientsClient({ initialClients }: B2BClientsClientProps) {
    const [clients, setClients] = useState<B2BClient[]>(initialClients);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast, ToastComponent } = useAdminToast();

    // Modals & Offcanvas
    const [isAddCanvasOpen, setIsAddCanvasOpen] = useState(false);
    const [isEditCanvasOpen, setIsEditCanvasOpen] = useState<string | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | null>(null);

    // Form Inputs
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        companyName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        rewardPercentage: 2
    });
    const [editFormData, setEditFormData] = useState({
        username: "",
        companyName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        rewardPercentage: 2
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
            setIsAddCanvasOpen(false);
            window.location.reload();
        } else {
            showToast(result.error || "Failed to add B2B Client", "error");
        }
        setLoading(false);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditCanvasOpen) return;
        setLoading(true);
        const result = await editB2BClient(isEditCanvasOpen, editFormData);

        if (result.success) {
            showToast("B2B Client updated successfully!");
            setIsEditCanvasOpen(null);
            window.location.reload();
        } else {
            showToast(result.error || "Failed to edit B2B Client", "error");
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
                        setFormData({ username: "", password: "", companyName: "", firstName: "", lastName: "", email: "", phone: "", address: "", city: "", zip: "", rewardPercentage: 2 });
                        setIsAddCanvasOpen(true);
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
                                <th>Reward %</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="no-results">No B2B clients found.</td>
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
                                            <span className="badge bg-warning text-dark border border-warning">
                                                {client.rewardPercentage ?? 2}%
                                            </span>
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
                                                    className="icon-btn"
                                                    style={{ background: "#f8fafc", color: "#3b82f6" }}
                                                    title="Edit Details"
                                                    onClick={() => {
                                                        setEditFormData({
                                                            username: client.username || "",
                                                            companyName: client.companyName || "",
                                                            firstName: client.firstName || "",
                                                            lastName: client.lastName || "",
                                                            email: client.email || "",
                                                            phone: client.phone || "",
                                                            address: client.address || "",
                                                            city: client.city || "",
                                                            zip: client.zip || "",
                                                            rewardPercentage: client.rewardPercentage ?? 2
                                                        });
                                                        setIsEditCanvasOpen(client.id);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
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

            {/* Offcanvas Sidebar for Add/Edit */}
            {(isAddCanvasOpen || isEditCanvasOpen) && (
                <div className="offcanvas-backdrop" onClick={() => { setIsAddCanvasOpen(false); setIsEditCanvasOpen(null); }}>
                    <div className="offcanvas-container" onClick={e => e.stopPropagation()}>
                        <div className="offcanvas-header">
                            <h3>{isAddCanvasOpen ? "Add New B2B Client" : "Edit B2B Client"}</h3>
                            <button className="offcanvas-close" onClick={() => { setIsAddCanvasOpen(false); setIsEditCanvasOpen(null); }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <form onSubmit={isAddCanvasOpen ? handleAddSubmit : handleEditSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden">
                            <div className="offcanvas-body">
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={isAddCanvasOpen ? formData.companyName : editFormData.companyName}
                                        onChange={e => isAddCanvasOpen
                                            ? setFormData({ ...formData, companyName: e.target.value })
                                            : setEditFormData({ ...editFormData, companyName: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="row g-2">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">First Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={isAddCanvasOpen ? formData.firstName : editFormData.firstName}
                                            onChange={e => isAddCanvasOpen
                                                ? setFormData({ ...formData, firstName: e.target.value })
                                                : setEditFormData({ ...editFormData, firstName: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={isAddCanvasOpen ? formData.lastName : editFormData.lastName}
                                            onChange={e => isAddCanvasOpen
                                                ? setFormData({ ...formData, lastName: e.target.value })
                                                : setEditFormData({ ...editFormData, lastName: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Username *</label>
                                    <input
                                        type="text"
                                        required
                                        value={isAddCanvasOpen ? formData.username : editFormData.username}
                                        onChange={e => {
                                            const val = e.target.value.toLowerCase().replace(/\s+/g, "");
                                            isAddCanvasOpen
                                                ? setFormData({ ...formData, username: val })
                                                : setEditFormData({ ...editFormData, username: val })
                                        }}
                                        placeholder="e.g. acme_corp"
                                    />
                                </div>
                                {isAddCanvasOpen && (
                                    <div className="form-group">
                                        <label>Password *</label>
                                        <input type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Full Address</label>
                                    <textarea
                                        className="form-control h-auto"
                                        rows={3}
                                        value={isAddCanvasOpen ? formData.address : editFormData.address}
                                        onChange={e => isAddCanvasOpen
                                            ? setFormData({ ...formData, address: e.target.value })
                                            : setEditFormData({ ...editFormData, address: e.target.value })
                                        }
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                    />
                                </div>
                                <div className="row g-2">
                                    <div className="col-8 mb-3">
                                        <label className="form-label small fw-bold">City</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={isAddCanvasOpen ? formData.city : editFormData.city}
                                            onChange={e => isAddCanvasOpen
                                                ? setFormData({ ...formData, city: e.target.value })
                                                : setEditFormData({ ...editFormData, city: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="col-4 mb-3">
                                        <label className="form-label small fw-bold">Zip</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={isAddCanvasOpen ? formData.zip : editFormData.zip}
                                            onChange={e => isAddCanvasOpen
                                                ? setFormData({ ...formData, zip: e.target.value })
                                                : setEditFormData({ ...editFormData, zip: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="form-group border-bottom pb-3 mb-3">
                                    <div className="row g-2">
                                        <div className="col-12 mb-3">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                value={isAddCanvasOpen ? formData.email : editFormData.email}
                                                onChange={e => isAddCanvasOpen
                                                    ? setFormData({ ...formData, email: e.target.value })
                                                    : setEditFormData({ ...editFormData, email: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label>Phone Number</label>
                                            <input
                                                type="text"
                                                value={isAddCanvasOpen ? formData.phone : editFormData.phone}
                                                onChange={e => isAddCanvasOpen
                                                    ? setFormData({ ...formData, phone: e.target.value })
                                                    : setEditFormData({ ...editFormData, phone: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group pb-0 mb-0">
                                    <label className="text-warning-emphasis"><i className="bi bi-gift-fill me-1 text-warning"></i> Reward Percentage (%)</label>
                                    <p className="text-muted small mb-2">Percentage points this client earns per order.</p>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={isAddCanvasOpen ? formData.rewardPercentage : editFormData.rewardPercentage}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            isAddCanvasOpen
                                                ? setFormData({ ...formData, rewardPercentage: val })
                                                : setEditFormData({ ...editFormData, rewardPercentage: val })
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="offcanvas-footer">
                                <button type="button" className="cancel-btn d-flex align-items-center justify-content-center gap-2" onClick={() => { setIsAddCanvasOpen(false); setIsEditCanvasOpen(null); }}>
                                    <i className="bi bi-x-lg"></i> Cancel
                                </button>
                                <button type="submit" className="save-btn d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                                    <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-check-lg'}`}></i>
                                    <span>{loading ? "Processing..." : (isAddCanvasOpen ? "Add B2B Client" : "Update Client")}</span>
                                </button>
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

                /* Offcanvas Styles */
                .offcanvas-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px); z-index: 11000; animation: fadeIn 0.3s ease; }
                .offcanvas-container { position: fixed; right: 0; top: 0; height: 100vh; width: 100%; max-width: 500px; background: #fff; box-shadow: -20px 0 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1); z-index: 11001; }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                
                .offcanvas-header { padding: 1.75rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fff; flex-shrink: 0; }
                .offcanvas-header h3 { margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
                .offcanvas-close { width: 40px; height: 40px; border-radius: 12px; border: none; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 1.1rem; }
                .offcanvas-close:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }
                
                .offcanvas-body { flex: 1; overflow-y: auto; padding: 2.5rem 2rem; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
                .offcanvas-body::-webkit-scrollbar { width: 6px; }
                .offcanvas-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .offcanvas-footer { 
                    padding: 1.5rem 2rem; 
                    border-top: 1px solid #f1f5f9; 
                    display: grid; 
                    grid-template-columns: 1fr 2fr; 
                    gap: 1rem; 
                    background: #fff; 
                    flex-shrink: 0;
                    box-shadow: 0 -10px 20px -10px rgba(0,0,0,0.05);
                }
                
                .offcanvas-footer button { 
                    height: 52px; 
                    border-radius: 14px; 
                    font-weight: 700; 
                    font-size: 0.9375rem; 
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
                    border: none; 
                    cursor: pointer; 
                }

                .offcanvas-footer .cancel-btn { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
                .offcanvas-footer .cancel-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
                
                .offcanvas-footer .save-btn { background: #ffc451; color: #fff; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.4); }
                .offcanvas-footer .save-btn:hover:not(:disabled) { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 196, 81, 0.5); }
                .offcanvas-footer .save-btn:active { transform: translateY(0); }
                .offcanvas-footer .save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 12000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
                .modal-content { background: #fff; padding: 2.5rem; border-radius: 28px; width: 100%; max-width: 460px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25); position: relative; border: 1px solid #f1f5f9; }
                .modal-content h3 { margin-bottom: 0.75rem; font-size: 1.4rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
                
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; font-size: 0.8125rem; color: #64748b; font-weight: 700; margin-bottom: 0.625rem; text-transform: uppercase; letter-spacing: 0.025em; }
                .form-group input, .form-group textarea { width: 100%; padding: 0.875rem 1.125rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; transition: all 0.2s; font-family: inherit; font-size: 0.9375rem; color: #1e293b; box-sizing: border-box; }
                .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.15); }
                .form-group input::placeholder { color: #94a3b8; }
                
                .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
                .modal-actions button { height: 48px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; }
                .modal-actions .cancel-btn { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
                .modal-actions .save-btn { background: #ffc451; color: #0f172a; }
                .modal-actions .delete-btn { background: #ef4444; color: #fff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
                .modal-actions .delete-btn:hover { background: #dc2626; transform: translateY(-2px); }

                @media (max-width: 768px) {
                    .customers-header { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .add-client-btn { justify-content: center; }
                }
            `}</style>
        </div>
    );
}
