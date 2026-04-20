"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addHeroBanner, updateHeroBanner, deleteHeroBanner } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

interface HeroBanner {
    id: string;
    image: string;
    order: number;
}

interface HeroBannerClientProps {
    initialBanners: any[];
}

export default function HeroBannerClient({ initialBanners }: HeroBannerClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    const [banners, setBanners] = useState<HeroBanner[]>(initialBanners as HeroBanner[]);
    const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Sync local state when props change (after router.refresh())
    useEffect(() => {
        setBanners(initialBanners as HeroBanner[]);
    }, [initialBanners]);

    const [formData, setFormData] = useState({
        image: "",
        order: 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddClick = () => {
        setEditingBanner(null);
        setFormData({ image: "", order: banners.length });
        setImageFile(null);
        setImagePreview("");
        setIsCreating(true);
    };

    const handleEditClick = (banner: HeroBanner) => {
        setEditingBanner(banner);
        setFormData({ image: banner.image, order: banner.order });
        setImageFile(null);
        setImagePreview(banner.image);
        setIsCreating(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image;

            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("images", imageFile);
                uploadFormData.append("folder", "hero");

                const res = await fetch("/api/admin/website/upload", {
                    method: "POST",
                    body: uploadFormData,
                });
                const result = await res.json();
                if (result.success && result.urls.length > 0) {
                    imageUrl = result.urls[0];
                } else {
                    throw new Error(result.error || "Failed to upload image");
                }
            }

            if (editingBanner) {
                const res = await updateHeroBanner(editingBanner.id, imageUrl, formData.order);
                if (res.success) {
                    showToast("Banner updated successfully");
                    router.refresh();
                    setIsCreating(false);
                } else {
                    showToast(res.error || "Failed to update banner", "error");
                }
            } else {
                const res = await addHeroBanner(imageUrl, formData.order);
                if (res.success) {
                    showToast("Banner added successfully");
                    router.refresh();
                    setIsCreating(false);
                } else {
                    showToast(res.error || "Failed to add banner", "error");
                }
            }
        } catch (error: any) {
            showToast(error.message || "Something went wrong", "error");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const res = await deleteHeroBanner(id);
        setLoading(false);
        setIsDeleting(null);
        if (res.success) {
            showToast("Banner deleted successfully");
            router.refresh();
        } else {
            showToast(res.error || "Failed to delete banner", "error");
        }
    };

    return (
        <div className="hero-banners-container">
            {ToastComponent}

            {isDeleting && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <div className="modal-icon warning">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h3>Are you sure?</h3>
                        <p>This banner will be removed from the homepage.</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
                            <button className="delete-btn" onClick={() => handleDelete(isDeleting)} disabled={loading}>
                                {loading ? "Deleting..." : "Delete Banner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="modal-overlay">
                    <div className="confirm-modal hero-edit-modal">
                        <h3>{editingBanner ? "Edit Hero Banner" : "Add Hero Banner"}</h3>
                        <form onSubmit={handleSubmit} className="hero-form">
                            <div className="input-group">
                                <label>Banner Image (1920 x 800 px)</label>
                                <div className="banner-upload-box" onClick={() => fileInputRef.current?.click()}>
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="upload-overlay">
                                                <i className="bi bi-camera"></i>
                                                <span>Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="placeholder">
                                            <i className="bi bi-cloud-upload"></i>
                                            <span>Click to upload hero banner</span>
                                            <small>Optimal resolution: 1920 x 800 px</small>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="input-group">
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    placeholder="Enter order (e.g. 1)"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsCreating(false)}>Discard</button>
                                <button type="submit" className="save-btn" disabled={loading || (!imagePreview && !imageFile)}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                    ) : (
                                        <><i className="bi bi-check-circle me-1"></i> {editingBanner ? "Update Banner" : "Save Banner"}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="section-header">
                <div>
                    <h3>Hero Banners</h3>
                    <p>Manage images for the homepage slider.</p>
                </div>
                <button className="add-btn" onClick={handleAddClick}>
                    <i className="bi bi-plus-lg"></i> Add New Banner
                </button>
            </div>

            <div className="banners-grid">
                {banners.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-image"></i>
                        <p>No banners added yet.</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="banner-card">
                            <div className="banner-img">
                                <img src={banner.image} alt={`Banner ${banner.order}`} />
                                <div className="banner-tag">Order: {banner.order}</div>
                            </div>
                            <div className="banner-actions">
                                <button className="edit-btn" onClick={() => handleEditClick(banner)}>
                                    <i className="bi bi-pencil"></i> Edit
                                </button>
                                <button className="delete-btn" onClick={() => setIsDeleting(banner.id)}>
                                    <i className="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .hero-banners-container { width: 100%; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .section-header h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .section-header p { color: #64748b; margin: 0; }
                
                .add-btn { background: #ffc451; color: #fff; padding: 10px 24px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.5rem; }
                .add-btn:hover { background: #f8b42d; transform: translateY(-2px); }

                .banners-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .banner-card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .banner-img { height: 180px; position: relative; }
                .banner-img img { width: 100%; height: 100%; object-fit: cover; }
                .banner-tag { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                
                .banner-actions { padding: 1rem; display: flex; gap: 0.5rem; }
                .banner-actions button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.9rem; }
                .edit-btn:hover { background: #f8fafc; color: #ffc451; border-color: #ffc451; }
                .delete-btn:hover { background: #fef2f2; color: #dc2626; border-color: #dc2626; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .confirm-modal { background: #fff; padding: 2.5rem; border-radius: 28px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                .hero-edit-modal { text-align: left; }
                .hero-edit-modal h3 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
                .hero-form { margin-top: 1.5rem; }
                
                .input-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
                .input-group label { display: block; font-weight: 700; color: #475569; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.025em; }
                .input-group input { width: 100%; padding: 0.875rem 1rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; transition: all 0.2s; }
                .input-group input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }
                
                .banner-upload-box { width: 100%; height: 220px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; position: relative; transition: all 0.3s; }
                .banner-upload-box:hover { border-color: #ffc451; background: #fff9ed; }
                .banner-upload-box img { width: 100%; height: 100%; object-fit: cover; }
                
                .upload-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #fff; opacity: 0; transition: 0.2s; }
                .banner-upload-box:hover .upload-overlay { opacity: 1; }
                .upload-overlay i { font-size: 2rem; }
                .upload-overlay span { font-weight: 600; font-size: 0.9rem; }

                .banner-upload-box .placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: #64748b; text-align: center; padding: 1rem; }
                .banner-upload-box .placeholder i { font-size: 2.5rem; color: #ffc451; }
                .banner-upload-box .placeholder span { font-weight: 700; color: #1e293b; }
                .banner-upload-box .placeholder small { font-size: 0.75rem; color: #94a3b8; }
                
                .modal-footer { display: flex; gap: 1rem; margin-top: 2.5rem; }
                .modal-footer button { flex: 1; padding: 1rem; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
                
                .cancel-btn { background: #f1f5f9; color: #64748b; border: none; }
                .cancel-btn:hover { background: #e2e8f0; color: #1e293b; }
                
                .save-btn { background: #ffc451; color: #fff; border: none; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.3); }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(255, 196, 81, 0.4); }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
                
                .hidden { display: none; }
                .empty-state { grid-column: 1 / -1; padding: 4rem; text-align: center; color: #94a3b8; background: #fff; border-radius: 24px; border: 1px dashed #e2e8f0; }
                .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
            `}</style>
        </div>
    );
}
