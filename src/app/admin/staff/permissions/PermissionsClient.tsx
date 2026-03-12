"use client";

import { useState, useEffect } from "react";
import { Permission, addPermission, deletePermission, updatePermission } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

export default function PermissionsClient({ initialPermissions }: { initialPermissions: Permission[] }) {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [form, setForm] = useState({ key: "", name: "", description: "" });

    // Filtering logic
    const filteredPermissions = initialPermissions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedPermissions = filteredPermissions.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const openAddModal = () => {
        setEditMode(false);
        setCurrentId(null);
        setForm({ key: "", name: "", description: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (p: Permission) => {
        setEditMode(true);
        setCurrentId(p.id);
        setForm({ key: p.key, name: p.name, description: p.description });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (editMode && currentId) {
            res = await updatePermission(currentId, form.name, form.description);
        } else {
            res = await addPermission(form.key, form.name, form.description);
        }

        setLoading(false);
        if (res.success) {
            showToast(editMode ? "Permission updated" : "Permission added", "success");
            setIsModalOpen(false);
            setForm({ key: "", name: "", description: "" });
            window.location.reload();
        } else {
            showToast(res.error || "Failed", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might affect existing roles.")) return;
        const res = await deletePermission(id);
        if (res.success) {
            showToast("Deleted", "success");
            window.location.reload();
        }
    };

    return (
        <div className="permissions-page">
            {ToastComponent}
            <div className="page-header">
                <div>
                    <h3>Permissions</h3>
                    <p>Define available system access levels.</p>
                </div>
                <button className="add-btn" onClick={openAddModal}>
                    <i className="bi bi-plus-lg"></i> New Permission
                </button>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by Key or Display Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="perm-table desktop-only-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Display Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPermissions.map(p => (
                            <tr key={p.id}>
                                <td data-label="Key"><code>{p.key}</code></td>
                                <td data-label="Display Name"><strong>{p.name}</strong></td>
                                <td data-label="Description">{p.description}</td>
                                <td data-label="Actions" className="actions-cell">
                                    <button className="edit-btn" onClick={() => openEditModal(p)} title="Edit Permission">
                                        <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(p.id)} title="Delete Permission">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedPermissions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4">No permissions found matching your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="perm-cards mobile-only-cards">
                    {paginatedPermissions.length === 0 ? (
                        <div className="empty-state">No permissions found matching your search.</div>
                    ) : (
                        paginatedPermissions.map(p => (
                            <div className="perm-card" key={p.id}>
                                <div className="card-header">
                                    <div className="name-group">
                                        <div className="perm-name">{p.name}</div>
                                        <code className="perm-key">{p.key}</code>
                                    </div>
                                    <div className="card-actions">
                                        <button className="edit-btn" onClick={() => openEditModal(p)}>
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <p className="perm-description">{p.description || "No description provided."}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-wrap">
                        <p className="pagination-info">
                            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredPermissions.length)} of {filteredPermissions.length}
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
                        <h3>{editMode ? "Edit Permission" : "Add Permission"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>System Key (e.g. manage_orders)</label>
                                <input
                                    required
                                    disabled={editMode}
                                    value={form.key}
                                    onChange={e => setForm({ ...form, key: e.target.value })}
                                    placeholder="e.g. manage_orders"
                                />
                                {editMode && <small className="hint">System keys cannot be changed once created.</small>}
                            </div>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Manage Orders"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief explanation of what this allows..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? "Saving..." : editMode ? "Update Permission" : "Save Permission"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .add-btn { background: #0f172a; color: #fff; padding: 0.75rem 1.25rem; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; }
                .add-btn:hover { background: #1e293b; transform: translateY(-2px); }
                
                .table-card { background: #fff; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; background: #fff; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.9375rem; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; }

                .perm-table { width: 100%; border-collapse: collapse; }
                .perm-table th { background: #f8fafc; padding: 1.25rem 1rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; }
                .perm-table td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 0.9375rem; }
                
                code { background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; color: #475569; }
                
                .actions-cell { display: flex; gap: 0.75rem; }
                .edit-btn, .delete-btn { background: #f8fafc; border: 1px solid #f1f5f9; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 1rem; transition: 0.2s; }
                .edit-btn { color: #6366f1; }
                .edit-btn:hover { background: #6366f1; color: #fff; transform: translateY(-2px); }
                .delete-btn { color: #ef4444; }
                .delete-btn:hover { background: #ef4444; color: #fff; transform: translateY(-2px); }
                
                .pagination-wrap { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #fafbfc; border-top: 1px solid #f1f5f9; }
                .pagination-info { margin: 0; font-size: 0.875rem; color: #64748b; }
                .pagination-controls { display: flex; align-items: center; gap: 1rem; }
                .pagination-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .pagination-btn:hover:not(:disabled) { background: #ffc451; color: #fff; border-color: #ffc451; }
                .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-pages { font-size: 0.875rem; font-weight: 600; color: #475569; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .modal-content { background: #fff; padding: 2.5rem; border-radius: 24px; width: 100%; max-width: 450px; }
                .modal-content h3 { margin-top: 0; margin-bottom: 1.5rem; font-weight: 800; color: #0f172a; }
                
                .form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.8125rem; font-weight: 700; color: #64748b; }
                .form-group input, .form-group textarea { padding: 0.875rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.9375rem; }
                .form-group input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
                .hint { font-size: 0.75rem; color: #94a3b8; }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
                .cancel-btn { background: none; border: none; color: #94a3b8; font-weight: 700; cursor: pointer; }
                .submit-btn { background: #ffc451; border: none; padding: 0.875rem 1.75rem; border-radius: 14px; color: #fff; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .submit-btn:hover { background: #f8b42d; transform: translateY(-2px); }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

                .mobile-only-cards { display: none; }
                .empty-state { text-align: center; padding: 2.5rem; color: #94a3b8; font-style: italic; font-size: 0.875rem; }

                @media (max-width: 768px) {
                    .page-header { flex-direction: column; align-items: stretch; gap: 1rem; text-align: left; margin-bottom: 1.5rem; }
                    .add-btn { justify-content: center; height: 50px; font-size: 1rem; border-radius: 14px; }
                    .search-box { max-width: none; }
                    .table-actions { padding: 1rem; }
                    
                    .desktop-only-table { display: none; }
                    .mobile-only-cards { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; background: #fafbfc; }
                    
                    .perm-card { background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #e2e8f0; }
                    .name-group { display: flex; flex-direction: column; gap: 0.35rem; }
                    .perm-name { font-size: 1.05rem; font-weight: 800; color: #0f172a; }
                    .perm-key { font-size: 0.7rem; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; width: fit-content; line-height: 1; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-weight: 700; }
                    
                    .card-actions { display: flex; gap: 0.5rem; }
                    .card-actions .edit-btn, .card-actions .delete-btn { width: 36px; height: 36px; background: #fff; }
                    
                    .card-body { position: relative; }
                    .perm-description { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin: 0; font-weight: 500; }

                    .pagination-wrap { flex-direction: column; gap: 1rem; text-align: center; padding: 1.25rem 1rem; }
                    .modal-content { padding: 1.5rem; border-radius: 20px; }
                }
            `}</style>
        </div>
    );
}
