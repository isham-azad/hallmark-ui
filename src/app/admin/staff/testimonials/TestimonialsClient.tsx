"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTestimonial, updateTestimonial, deleteTestimonial, setTestimonialStatus } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    quote: string;
    rating: number;
    status: "active" | "disabled";
}

interface TestimonialsClientProps {
    initialTestimonials: Testimonial[];
}

export default function TestimonialsClient({ initialTestimonials }: TestimonialsClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ name: "", role: "", quote: "", rating: 5 });
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();

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

    const filteredTestimonials = initialTestimonials.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredTestimonials.slice(startIndex, startIndex + itemsPerPage);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        const result = await deleteTestimonial(id);
        setIsDeleting(null);

        if (result.success) {
            showToast("Testimonial deleted successfully");
            router.refresh();
        } else {
            showToast(result.error || "Failed to delete testimonial", "error");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
        const nextStatus = currentStatus === "active" ? "disabled" : "active";
        setTogglingStatusId(id);
        const result = await setTestimonialStatus(id, nextStatus);
        setTogglingStatusId(null);
        if (result.success) {
            showToast(nextStatus === "disabled" ? "Testimonial disabled" : "Testimonial enabled");
            router.refresh();
        } else {
            showToast(result.error || "Failed to update status", "error");
        }
    };

    const handleEdit = (t: Testimonial) => {
        setEditingTestimonial(t);
        setFormData({ name: t.name, role: t.role, quote: t.quote, rating: t.rating });
    };

    const handleAdd = () => {
        setIsAdding(true);
        setFormData({ name: "", role: "", quote: "", rating: 5 });
    };

    const closeForm = () => {
        setIsAdding(false);
        setEditingTestimonial(null);
        setFormData({ name: "", role: "", quote: "", rating: 5 });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.role.trim() || !formData.quote.trim()) return;

        setIsSaving(true);
        let result;
        if (editingTestimonial) {
            result = await updateTestimonial(editingTestimonial.id, formData);
        } else {
            result = await createTestimonial(formData);
        }
        setIsSaving(false);

        if (result.success) {
            showToast(editingTestimonial ? "Testimonial updated" : "Testimonial added");
            closeForm();
            router.refresh();
        } else {
            showToast(result.error || "Failed to save testimonial", "error");
        }
    };

    return (
        <div className="testimonials-container">
            {ToastComponent}

            {isDeleting && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <div className="modal-icon warning">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h3>Are you sure?</h3>
                        <p>This action cannot be undone. You are about to delete this testimonial.</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
                            <button className="delete-btn" onClick={() => handleDelete(isDeleting)}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {(isAdding || editingTestimonial) && (
                <div className="modal-overlay">
                    <div className="form-modal">
                        <div className="modal-header">
                            <h3>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</h3>
                            <button className="close-btn" onClick={closeForm}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role / Position</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                    placeholder="e.g. Retail Store Owner"
                                />
                            </div>
                            <div className="form-group">
                                <label>Quote</label>
                                <textarea
                                    value={formData.quote}
                                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Enter testimonial quote"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Rating (1-5)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Testimonial"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="testimonials-header">
                <div className="header-info">
                    <h3>Testimonials</h3>
                    <p>Manage customer feedback and testimonials.</p>
                </div>
                <button className="add-testimonial-btn" onClick={handleAdd}>
                    <i className="bi bi-plus-lg"></i>
                    Add New
                </button>
            </div>

            <div className="table-actions">
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search by name or role..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="testimonials-grid">
                {currentItems.map((testimonial) => (
                    <div key={testimonial.id} className="testimonial-card">
                        <div className="testimonial-card-header">
                            <div className="testimonial-info">
                                <span className={`status-pill ${testimonial.status}`}>
                                    {testimonial.status === "active" ? "Active" : "Disabled"}
                                </span>
                            </div>
                            <div className="testimonial-actions">
                                <button
                                    className="icon-btn"
                                    title="Edit"
                                    onClick={() => handleEdit(testimonial)}
                                >
                                    <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                    className={`icon-btn ${testimonial.status === "active" ? "disable" : "enable"}`}
                                    title={testimonial.status === "active" ? "Disable" : "Enable"}
                                    onClick={() => handleToggleStatus(testimonial.id, testimonial.status)}
                                    disabled={togglingStatusId === testimonial.id}
                                >
                                    <i className={`bi ${testimonial.status === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                                </button>
                                <button
                                    className="icon-btn delete"
                                    title="Delete"
                                    onClick={() => setIsDeleting(testimonial.id)}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div className="testimonial-body">
                            <h4>{testimonial.name}</h4>
                            <h5>{testimonial.role}</h5>
                            <div className="stars">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <i key={i} className="bi bi-star-fill text-warning"></i>
                                ))}
                            </div>
                            <p>"{testimonial.quote}"</p>
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

                .confirm-modal, .form-modal {
                    background: #fff;
                    padding: 2.5rem;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                }

                .form-modal {
                    max-width: 600px;
                    text-align: left;
                    padding: 2rem;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #0f172a;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.25rem;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .close-btn:hover {
                    color: #0f172a;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #334155;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: 0.2s;
                    font-family: inherit;
                }

                .form-group input:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: #ffc451;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .save-btn {
                    background: #ffc451;
                    color: #fff;
                    border: none;
                    padding: 0.875rem 2rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .save-btn:hover:not(:disabled) {
                    background: #f8b42d;
                    transform: translateY(-2px);
                }
                
                .save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
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

                .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; font-weight: 600; padding: 0.875rem; border-radius: 12px; cursor: pointer; }
                .cancel-btn:hover { background: #f1f5f9; }

                .delete-btn { background: #ef4444; border: none; color: #fff; }
                .delete-btn:hover { background: #dc2626; transform: translateY(-2px); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .testimonials-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .header-info h3 {
                    font-size: 1.5rem;
                    margin: 0 0 0.25rem 0;
                    color: #0f172a;
                }

                .header-info p {
                    color: #64748b;
                    margin: 0;
                }

                .add-testimonial-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 10px 24px;
                    background: #ffc451;
                    color: #ffffff;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    line-height: 1;
                    font-size: 0.95rem;
                    box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25);
                }

                .add-testimonial-btn:hover {
                    background: #f8b42d;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(255, 196, 81, 0.35);
                }

                .table-actions {
                    margin-bottom: 2rem;
                }

                .search-box {
                    position: relative;
                    max-width: 400px;
                }

                .search-box i {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .search-box input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.75rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                }

                .testimonials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .testimonial-card {
                    background: #fff;
                    border: 1px solid #f1f5f9;
                    border-radius: 20px;
                    padding: 1.5rem;
                    transition: all 0.3s;
                    display: flex;
                    flex-direction: column;
                }

                .testimonial-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }

                .testimonial-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .status-pill {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .status-pill.active {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-pill.disabled {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .testimonial-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid #f1f5f9;
                    background: #f8fafc;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: #38bdf8;
                    color: #fff;
                    border-color: #38bdf8;
                }

                .icon-btn.disable {
                    background: #fff7ed;
                    color: #ea580c;
                    border-color: #fff7ed;
                }

                .icon-btn.enable {
                    background: #f0fdf4;
                    color: #16a34a;
                    border-color: #f0fdf4;
                }

                .icon-btn.disable:hover {
                    background: #ea580c;
                    color: #fff;
                    border-color: #ea580c;
                }

                .icon-btn.enable:hover {
                    background: #16a34a;
                    color: #fff;
                    border-color: #16a34a;
                }

                .icon-btn.delete:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                }

                .testimonial-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .testimonial-body h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.125rem;
                    color: #0f172a;
                }

                .testimonial-body h5 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .stars {
                    color: #ffc107;
                    margin-bottom: 1rem;
                    display: flex;
                    gap: 2px;
                }

                .testimonial-body p {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.6;
                    margin: 0;
                    font-style: italic;
                    flex: 1;
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 3rem;
                    padding-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .pager-btn {
                    min-width: 40px;
                    height: 40px;
                    padding: 0 0.5rem;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    color: #64748b;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                    flex-shrink: 0;
                }

                .pager-btn:hover:not(:disabled) {
                    border-color: #ffc451;
                    color: #ffc451;
                }

                .pager-btn.active {
                    background: #ffc451;
                    border-color: #ffc451;
                    color: #fff;
                    box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25);
                }

                .pager-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #f8fafc;
                }

                @media (max-width: 768px) {
                    .testimonials-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .add-testimonial-btn { width: 100%; justify-content: center; }
                    .search-box { max-width: none; }
                }
            `}</style>
        </div>
    );
}
