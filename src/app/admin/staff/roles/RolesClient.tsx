"use client";

import { useState, useEffect } from "react";
import { RoleData, addRole, updateRole, deleteRole } from "./actions";
import { Permission } from "../permissions/actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 9; // 3x3 grid looks good

interface RolesClientProps {
    initialRoles: RoleData[];
    allPermissions: Permission[];
}

export default function RolesClient({ initialRoles, allPermissions }: RolesClientProps) {
    const [roles, setRoles] = useState(initialRoles);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [form, setForm] = useState({ name: "", permissionKeys: [] as string[] });

    // Filtering logic
    const filteredRoles = initialRoles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedRoles = filteredRoles.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const openAddModal = () => {
        setEditMode(false);
        setCurrentId(null);
        setForm({ name: "", permissionKeys: [] });
        setIsModalOpen(true);
    };

    const openEditModal = (r: RoleData) => {
        setEditMode(true);
        setCurrentId(r.id);
        setForm({ name: r.name, permissionKeys: [...r.permissionKeys] });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (editMode && currentId) {
            res = await updateRole(currentId, form.name, form.permissionKeys);
        } else {
            res = await addRole(form.name, form.permissionKeys);
        }

        setLoading(false);
        if (res.success) {
            showToast(editMode ? "Role updated" : "Role created", "success");
            setIsModalOpen(false);
            setForm({ name: "", permissionKeys: [] });
            window.location.reload();
        } else {
            showToast(res.error || "Failed", "error");
        }
    };

    const togglePermission = (key: string) => {
        setForm(prev => ({
            ...prev,
            permissionKeys: prev.permissionKeys.includes(key)
                ? prev.permissionKeys.filter(k => k !== key)
                : [...prev.permissionKeys, key]
        }));
    };

    const handleDelete = async (id: string, name: string) => {
        if (name === "Super Admin") {
            showToast("Cannot delete Super Admin role", "error");
            return;
        }
        if (!confirm(`Are you sure you want to delete the ${name} role?`)) return;

        const res = await deleteRole(id);
        if (res.success) {
            showToast("Role deleted", "success");
            window.location.reload();
        }
    };

    return (
        <div className="roles-page">
            {ToastComponent}
            <div className="page-header">
                <div className="header-info">
                    <h3>Roles</h3>
                    <p>Manage groups of permissions for admins.</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by role name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="add-btn" onClick={openAddModal}>
                        <i className="bi bi-shield-plus"></i> Create Role
                    </button>
                </div>
            </div>

            <div className="grid">
                {paginatedRoles.map(role => (
                    <div key={role.id} className="role-card">
                        <div className="role-card-header">
                            <div className="role-info">
                                <h4>{role.name}</h4>
                                <span className="perm-count">
                                    {role.name === "Super Admin" ? allPermissions.length : role.permissionKeys.length} permissions
                                </span>
                            </div>
                            <div className="card-actions">
                                {role.name !== "Super Admin" && (
                                    <button className="edit-icon" onClick={() => openEditModal(role)} title="Edit Role">
                                        <i className="bi bi-pencil-square"></i>
                                    </button>
                                )}
                                <button className="del-icon" onClick={() => handleDelete(role.id, role.name)} title="Delete Role">
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div className="perm-list">
                            {role.name === "Super Admin" ? (
                                <span className="perm-badge all-access">All Permissions Granted Automatically</span>
                            ) : role.permissionKeys.length === 0 ? (
                                <span className="no-perm">No permissions assigned</span>
                            ) : (
                                role.permissionKeys.map(key => (
                                    <span key={key} className="perm-badge">{key.replace(/_/g, " ")}</span>
                                ))
                            )}
                        </div>
                    </div>
                ))}
                {paginatedRoles.length === 0 && (
                    <div className="no-results">No roles found matching "{searchTerm}"</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination-wrap">
                    <p className="pagination-info">
                        Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredRoles.length)} of {filteredRoles.length}
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

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editMode ? "Edit Role" : "Create New Role"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Role Name (e.g. Sales Manager)</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Content Editor"
                                />
                            </div>

                            <div className="permissions-selector">
                                <label>Select Permissions</label>
                                <div className="perm-options">
                                    {allPermissions.map(p => (
                                        <label key={p.key} className="perm-option">
                                            <input
                                                type="checkbox"
                                                checked={form.permissionKeys.includes(p.key)}
                                                onChange={() => togglePermission(p.key)}
                                            />
                                            <div className="perm-details">
                                                <span>{p.name}</span>
                                                <small>{p.description}</small>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? "Saving..." : editMode ? "Update Role" : "Save Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 2rem; }
                .header-info h3 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
                .header-info p { margin: 4px 0 0 0; color: #64748b; }
                .header-actions { display: flex; align-items: center; gap: 1rem; flex: 1; justify-content: flex-end; }
                .add-btn { background: #0f172a; color: #fff; padding: 0.75rem 1.25rem; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; height: 46px; display: flex; align-items: center; gap: 0.5rem; }
                .add-btn:hover { background: #1e293b; transform: translateY(-2px); }
                
                .search-box { position: relative; width: 100%; max-width: 300px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; height: 46px; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-family: inherit; font-size: 0.9375rem; transition: 0.2s; }
                .search-box input:focus { outline: none; border-color: #ffc451; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1); }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; }

                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; min-height: 200px; }
                .role-card { background: #fff; padding: 1.75rem; border-radius: 24px; border: 1px solid #f1f5f9; transition: 0.3s; height: fit-content; }
                .role-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.05); transform: translateY(-4px); }
                
                .role-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
                .role-info h4 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
                .perm-count { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                
                .card-actions { display: flex; gap: 0.5rem; }
                .edit-icon, .del-icon { background: #f8fafc; border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .edit-icon { color: #6366f1; }
                .edit-icon:hover { background: #6366f1; color: #fff; }
                .del-icon { color: #f43f5e; }
                .del-icon:hover { background: #f43f5e; color: #fff; }
                
                .perm-badge { background: #f1f5f9; padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: capitalize; border: 1px solid #e2e8f0; margin-bottom: 0.25rem; display: inline-block; margin-right: 0.25rem; }
                .perm-badge.all-access { background: #f0fdf4; color: #166534; border-color: #bbf7d0; text-transform: none; display: block; text-align: center; width: 100%; }
                .no-perm { color: #94a3b8; font-size: 0.875rem; font-style: italic; }
                .no-results { grid-column: 1 / -1; text-align: center; padding: 4rem; color: #64748b; font-style: italic; }

                .pagination-wrap { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding: 1.25rem; background: #fff; border-radius: 16px; border: 1px solid #f1f5f9; }
                .pagination-info { margin: 0; font-size: 0.875rem; color: #64748b; }
                .pagination-controls { display: flex; align-items: center; gap: 1rem; }
                .pagination-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .pagination-btn:hover:not(:disabled) { background: #ffc451; color: #fff; border-color: #ffc451; }
                .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-pages { font-size: 0.875rem; font-weight: 600; color: #475569; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
                .modal-content { background: #fff; padding: 2.5rem; border-radius: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
                .modal-content h3 { margin-top: 0; margin-bottom: 2rem; font-weight: 800; color: #0f172a; }
                
                .form-group { margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
                .form-group label { font-size: 0.8125rem; font-weight: 700; color: #64748b; }
                .form-group input { padding: 0.875rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 1rem; }
                
                .perm-options { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem; }
                .perm-option { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; border-radius: 14px; border: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
                .perm-option:hover { background: #f8fafc; border-color: #e2e8f0; }
                .perm-option input[type="checkbox"] { width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #ffc451; }
                
                .perm-details { display: flex; flex-direction: column; gap: 0.15rem; }
                .perm-details span { font-weight: 700; font-size: 0.9375rem; color: #1e293b; }
                .perm-details small { color: #64748b; font-size: 0.8125rem; }
                
                .modal-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; margin-top: 2.5rem; }
                .cancel-btn { background: none; border: none; color: #94a3b8; font-weight: 700; cursor: pointer; font-size: 0.9375rem; }
                .submit-btn { background: #ffc451; color: #fff; padding: 1rem 2rem; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 0.9375rem; }
                .submit-btn:hover { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 196, 81, 0.3); }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                @media (max-width: 768px) {
                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .header-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .search-box {
                        max-width: none;
                    }
                    .add-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    .grid {
                        grid-template-columns: 1fr;
                    }
                    .pagination-wrap {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }
                    .modal-content {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
