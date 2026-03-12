"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AdminUser, addStaff, editStaff, updateStaffRole, deleteStaff } from "./actions";
import { RoleData } from "./roles/actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

interface StaffClientProps {
    initialStaff: AdminUser[];
    availableRoles: RoleData[];
}

export default function StaffClient({ initialStaff, availableRoles }: StaffClientProps) {
    const [staff, setStaff] = useState(initialStaff);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStaffId, setEditStaffId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: availableRoles[availableRoles.length - 1]?.name || ""
    });

    // Filtering logic
    const filteredStaff = initialStaff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSaveStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (editStaffId) {
            const res = await editStaff(editStaffId, form.name, form.email, form.phone, form.role);
            setLoading(false);
            if (res.success) {
                showToast("Staff updated successfully", "success");
                setIsModalOpen(false);
                setForm({ name: "", email: "", phone: "", role: availableRoles[availableRoles.length - 1]?.name || "" });
                setEditStaffId(null);
                window.location.reload();
            } else {
                showToast(res.error || "Failed to update staff", "error");
            }
        } else {
            const res = await addStaff(form.name, form.email, form.phone, form.role);
            setLoading(false);
            if (res.success) {
                showToast("Staff added successfully", "success");
                setIsModalOpen(false);
                setForm({ name: "", email: "", phone: "", role: availableRoles[availableRoles.length - 1]?.name || "" });
                window.location.reload();
            } else {
                showToast(res.error || "Failed to add staff", "error");
            }
        }
    };

    const handleOpenAddModal = () => {
        setEditStaffId(null);
        setForm({ name: "", email: "", phone: "", role: availableRoles[availableRoles.length - 1]?.name || "" });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (staff: AdminUser) => {
        setEditStaffId(staff.id);
        setForm({
            name: staff.name,
            email: staff.email,
            phone: staff.phone || "",
            role: staff.role || availableRoles[availableRoles.length - 1]?.name || ""
        });
        setIsModalOpen(true);
    };

    const handleUpdateRole = async (id: string, role: string) => {
        const res = await updateStaffRole(id, role as any);
        if (res.success) {
            showToast("Role updated", "success");
            window.location.reload();
        } else {
            showToast("Update failed", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;
        const res = await deleteStaff(id);
        if (res.success) {
            showToast("Staff removed", "success");
            window.location.reload();
        } else {
            showToast("Delete failed", "error");
        }
    };

    return (
        <div className="staff-container">
            {ToastComponent}
            <div className="staff-header">
                <div className="header-info">
                    <h3>Admins List</h3>
                    <p>Manage administrative access and roles.</p>
                </div>
                <button className="add-btn" onClick={handleOpenAddModal}>
                    <i className="bi bi-person-plus-fill"></i> Add Admin
                </button>
            </div>

            <div className="table-card">
                <div className="table-actions-bar">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="staff-table desktop-only-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Mobile No</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStaff.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="staff-name-cell">
                                            <div className="avatar-circle">{s.name[0].toUpperCase()}</div>
                                            <span className="name-text">{s.name}</span>
                                        </div>
                                    </td>
                                    <td>{s.email}</td>
                                    <td>{s.phone || "—"}</td>
                                    <td>
                                        <select
                                            value={s.role}
                                            onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                                            className={`role-select role-${s.role?.toLowerCase().replace(/\s+/g, "_")}`}
                                        >
                                            {availableRoles.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{s.createdAt ? format(new Date(s.createdAt), "MMM dd, yyyy") : "—"}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="edit-btn" onClick={() => handleOpenEditModal(s)} title="Edit Admin">
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(s.id)} title="Remove Admin">
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedStaff.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="empty-state">No admins found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="staff-cards mobile-only-cards">
                        {paginatedStaff.length === 0 ? (
                            <div className="empty-state">No admins found matching your search.</div>
                        ) : (
                            paginatedStaff.map((s) => (
                                <div className="staff-card" key={s.id}>
                                    <div className="card-header">
                                        <div className="avatar-circle">{s.name[0].toUpperCase()}</div>
                                        <div className="header-text">
                                            <div className="name-text">{s.name}</div>
                                            <div className="joined-text">Joined: {s.createdAt ? format(new Date(s.createdAt), "MMM dd, yyyy") : "—"}</div>
                                        </div>
                                        <div className="mobile-actions">
                                            <button className="edit-btn" onClick={() => handleOpenEditModal(s)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(s.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="info-item">
                                            <i className="bi bi-envelope"></i>
                                            <span>{s.email}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-telephone"></i>
                                            <span>{s.phone || "—"}</span>
                                        </div>
                                        <div className="info-item role-item">
                                            <i className="bi bi-shield-lock"></i>
                                            <select
                                                value={s.role}
                                                onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                                                className={`role-select mobile-role-select role-${s.role?.toLowerCase().replace(/\s+/g, "_")}`}
                                            >
                                                {availableRoles.map(r => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-wrap">
                        <p className="pagination-info">
                            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredStaff.length)} of {filteredStaff.length}
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

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editStaffId ? "Edit Admin Profile" : "Add New Admin"}</h3>
                        <form onSubmit={handleSaveStaff}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="admin@example.com"
                                    disabled={!!editStaffId}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input
                                    type="text"
                                    required
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Enter mobile number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    {availableRoles.map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-link" onClick={() => { setIsModalOpen(false); setEditStaffId(null); }}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? (editStaffId ? "Saving..." : "Adding...") : (editStaffId ? "Save Changes" : "Add Admin Member")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .staff-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .staff-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .add-btn { display: flex; align-items: center; gap: 0.5rem; background: #0f172a; border: none; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; color: #fff; cursor: pointer; transition: 0.2s; }
                .add-btn:hover { background: #1e293b; transform: translateY(-2px); }

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
                .avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; }
                .name-text { font-weight: 600; color: #0f172a; }

                .role-select { padding: 4px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase; }
                .role-select.role-super_admin { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
                .role-select.role-order_manager { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
                .role-select.role-product_manager { background: #fdf4ff; color: #701a75; border-color: #f5d0fe; }
                .role-select.role-delivery_staff { background: #fffbeb; color: #92400e; border-color: #fef3c7; }

                .action-buttons { display: flex; gap: 0.5rem; }
                .edit-btn { background: #fff; border: 1px solid #bfdbfe; color: #3b82f6; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .edit-btn:hover { background: #3b82f6; color: #fff; }
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

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #fff; padding: 2rem; border-radius: 24px; width: 100%; max-width: 450px; }
                .modal-content h3 { margin-top: 0; margin-bottom: 1.5rem; font-weight: 800; }
                .form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.8125rem; font-weight: 700; color: #64748b; }
                .form-group input, .form-group select { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                
                .modal-actions { display: flex; align-items: center; gap: 1.5rem; margin-top: 2rem; }
                .submit-btn { flex: 1; background: #ffc451; color: #fff; padding: 0.875rem; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
                .cancel-link { background: none; border: none; color: #94a3b8; font-weight: 600; cursor: pointer; }

                .table-responsive { overflow-x: auto; }
                .mobile-only-cards { display: none; }

                @media (max-width: 768px) {
                    .staff-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                    .add-btn { width: 100%; justify-content: center; height: 50px; font-size: 1rem; border-radius: 14px; }
                    .search-box { max-width: none; }
                    .table-actions-bar { padding: 1rem; }
                    
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
                    .role-item { align-items: center; }
                    .mobile-role-select { flex: 1; height: 36px; font-size: 0.7rem; }

                    .pagination-wrap { flex-direction: column; text-align: center; gap: 1rem; padding: 1.25rem 1rem; }
                    .modal-content { padding: 1.5rem; border-radius: 20px; }
                }
            `}</style>
        </div>
    );
}
