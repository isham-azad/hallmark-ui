"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/AdminToast";

export default function CategoryAddClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast, ToastComponent } = useAdminToast();

    const [formData, setFormData] = useState({
        name: "",
        summary: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImageFile(null);
        setImagePreviewUrl("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const form = new FormData();
            form.set("name", formData.name);
            form.set("summary", formData.summary);
            if (imageFile) form.set("image", imageFile);

            const res = await fetch("/api/admin/categories/create", { method: "POST", body: form });
            const result = await res.json();

            if (result.success) {
                showToast("Category added successfully!");
                setTimeout(() => router.push("/admin/categories"), 1000);
            } else {
                showToast(result.error || "Failed to add category", "error");
            }
        } catch {
            showToast("Failed to add category", "error");
        }
        setLoading(false);
    };

    return (
        <div className="add-category-container">
            {ToastComponent}
            <div className="header-actions mb-4">
                <Link href="/admin/categories" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Categories
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
                <div className="form-sections">
                    <div className="form-section main-info">
                        <h3>Category Information</h3>
                        <div className="input-group">
                            <label>Category Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Home Care, Fabric Care"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Summary</label>
                            <textarea
                                placeholder="Brief description of the category..."
                                rows={5}
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section image-section">
                        <h3>Category Image</h3>
                        <div className="input-group">
                            <label>Image</label>
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden-input"
                                />
                                {imagePreviewUrl ? (
                                    <>
                                        <img src={imagePreviewUrl} alt="Preview" className="preview-img" />
                                        <span>Click to change (uploaded on Save)</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-image"></i>
                                        <span>Choose image (uploaded on Save)</span>
                                    </>
                                )}
                            </div>
                            {imageFile && (
                                <button type="button" className="remove-image-btn" onClick={removeImage}>
                                    Remove image
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => router.push("/admin/categories")} className="cancel-btn">
                        Discard
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Saving..." : "Save Category"}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .add-category-container { max-width: 1000px; }
                .back-link {
                    display: flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none;
                    font-weight: 600; font-size: 0.9rem; transition: 0.2s;
                }
                .back-link:hover { color: #ffc451; }
                .category-form { display: flex; flex-direction: column; gap: 2rem; }
                .form-sections { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-section {
                    background: #fff; padding: 2rem; border-radius: 20px; border: 1px solid #f1f5f9;
                }
                .form-section h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; color: #1e293b; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
                .input-group label { font-size: 0.875rem; font-weight: 500; color: #64748b; }
                input, textarea {
                    padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
                    font-size: 0.9375rem; background: #f8fafc; transition: all 0.3s;
                }
                input:focus, textarea:focus {
                    outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
                }
                .upload-zone {
                    border: 2px dashed #e2e8f0; border-radius: 12px; padding: 2rem;
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
                    background: #f8fafc; cursor: pointer; transition: border-color 0.2s;
                }
                .upload-zone:hover { border-color: #ffc451; }
                .hidden-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }
                .upload-zone .preview-img { max-width: 100%; max-height: 120px; object-fit: contain; }
                .upload-zone i { font-size: 2rem; color: #ffc451; }
                .upload-zone span { font-weight: 600; color: #0f172a; font-size: 0.8rem; }
                .remove-image-btn {
                    margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; color: #ef4444;
                    background: transparent; border: 1px solid #fecaca; border-radius: 8px;
                    cursor: pointer; font-weight: 600;
                }
                .remove-image-btn:hover { background: #fef2f2; }
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 2rem; }
                .cancel-btn {
                    padding: 0.75rem 1.5rem; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px; font-weight: 600; color: #64748b; cursor: pointer;
                    transition: 0.2s;
                }
                .cancel-btn:hover { background: #f8fafc; color: #475569; }
                .save-btn {
                    padding: 0.75rem 2rem; background: #ffc451; border: none; border-radius: 12px;
                    font-weight: 700; color: #fff; cursor: pointer;
                }

                @media (max-width: 768px) {
                    .add-category-container { padding: 0.5rem; }
                    .form-section { padding: 1.5rem; }
                    .upload-zone { padding: 1.5rem; }
                    .form-actions { flex-direction: column; }
                    .form-actions button { width: 100%; }
                }
            `}</style>
        </div>
    );
}
