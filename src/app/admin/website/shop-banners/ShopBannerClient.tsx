"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addShopBanner, updateShopBanner, deleteShopBanner } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

interface ShopBanner {
    id: string;
    image: string;
    bannerMobile?: string;
    order: number;
}

interface ShopBannerClientProps {
    initialBanners: any[];
}

export default function ShopBannerClient({ initialBanners }: ShopBannerClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    const [banners, setBanners] = useState<ShopBanner[]>(initialBanners as ShopBanner[]);
    const [editingBanner, setEditingBanner] = useState<ShopBanner | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Sync local state when props change (after router.refresh())
    useEffect(() => {
        setBanners(initialBanners as ShopBanner[]);
    }, [initialBanners]);

    const [formData, setFormData] = useState({
        image: "",
        bannerMobile: "",
        order: 0,
    });

    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [desktopPreview, setDesktopPreview] = useState<string>("");
    const [mobileFile, setMobileFile] = useState<File | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string>("");

    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setDesktopFile(file);
            setDesktopPreview(URL.createObjectURL(file));
        }
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setMobileFile(file);
            setMobilePreview(URL.createObjectURL(file));
        }
    };

    const handleAddClick = () => {
        setEditingBanner(null);
        setFormData({ image: "", bannerMobile: "", order: banners.length });
        setDesktopFile(null);
        setDesktopPreview("");
        setMobileFile(null);
        setMobilePreview("");
        setIsCreating(true);
    };

    const handleEditClick = (banner: ShopBanner) => {
        setEditingBanner(banner);
        setFormData({ 
            image: banner.image, 
            bannerMobile: banner.bannerMobile || "", 
            order: banner.order 
        });
        setDesktopFile(null);
        setDesktopPreview(banner.image);
        setMobileFile(null);
        setMobilePreview(banner.bannerMobile || "");
        setIsCreating(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let desktopUrl = formData.image;
            let mobileUrl = formData.bannerMobile;

            // Upload Desktop Banner
            if (desktopFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("images", desktopFile);
                uploadFormData.append("folder", "shop_banners");

                const res = await fetch("/api/admin/website/upload", {
                    method: "POST",
                    body: uploadFormData,
                });
                const result = await res.json();
                if (result.success && result.urls.length > 0) {
                    desktopUrl = result.urls[0];
                } else {
                    throw new Error(result.error || "Failed to upload desktop banner");
                }
            }

            // Upload Mobile Banner
            if (mobileFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("images", mobileFile);
                uploadFormData.append("folder", "shop_banners/mobile");

                const res = await fetch("/api/admin/website/upload", {
                    method: "POST",
                    body: uploadFormData,
                });
                const result = await res.json();
                if (result.success && result.urls.length > 0) {
                    mobileUrl = result.urls[0];
                } else {
                    throw new Error(result.error || "Failed to upload mobile banner");
                }
            }

            if (editingBanner) {
                const res = await updateShopBanner(editingBanner.id, desktopUrl, formData.order, mobileUrl);
                if (res.success) {
                    showToast("Banner updated successfully");
                    router.refresh();
                    setIsCreating(false);
                } else {
                    showToast(res.error || "Failed to update banner", "error");
                }
            } else {
                const res = await addShopBanner(desktopUrl, formData.order, mobileUrl);
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
        const res = await deleteShopBanner(id);
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
        <div className="shop-banners-container">
            {ToastComponent}

            {isDeleting && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <div className="modal-icon warning">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h3>Are you sure?</h3>
                        <p>This banner will be removed from the Shop Online page.</p>
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
                        <h3>{editingBanner ? "Edit Shop Banner" : "Add Shop Banner"}</h3>
                        <p className="modal-subtitle">Upload separate banners for desktop and mobile views.</p>
                        
                        <form onSubmit={handleSubmit} className="hero-form">
                            <div className="banner-fields-grid">
                                <div className="input-group">
                                    <label>Desktop Banner (1920 x 450 px)</label>
                                    <div className="banner-upload-box desktop" onClick={() => desktopInputRef.current?.click()}>
                                        {desktopPreview ? (
                                            <>
                                                <img src={desktopPreview} alt="Desktop Preview" />
                                                <div className="upload-overlay">
                                                    <i className="bi bi-camera"></i>
                                                    <span>Change Desktop Banner</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="placeholder">
                                                <i className="bi bi-display"></i>
                                                <span>Upload Desktop Banner</span>
                                                <small>1920 x 450 px recommended</small>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={desktopInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleDesktopChange}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Mobile Banner (800 x 500 px)</label>
                                    <div className="banner-upload-box mobile" onClick={() => mobileInputRef.current?.click()}>
                                        {mobilePreview ? (
                                            <>
                                                <img src={mobilePreview} alt="Mobile Preview" />
                                                <div className="upload-overlay">
                                                    <i className="bi bi-phone"></i>
                                                    <span>Change Mobile Banner</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="placeholder">
                                                <i className="bi bi-phone"></i>
                                                <span>Upload Mobile Banner</span>
                                                <small>800 x 500 px recommended</small>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={mobileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleMobileChange}
                                    />
                                </div>
                            </div>

                            <div className="input-group mt-3">
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
                                <button type="submit" className="save-btn" disabled={loading || !desktopPreview}>
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
                    <h3>Shop Online Banners</h3>
                    <p>Manage promotional banners displayed on the Shop Online page.</p>
                </div>
                <button className="add-btn" onClick={handleAddClick}>
                    <i className="bi bi-plus-lg"></i> Add New Banner
                </button>
            </div>

            <div className="banners-grid">
                {banners.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-image"></i>
                        <p>No shop banners added yet.</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="banner-card">
                            <div className="banner-img">
                                <img src={banner.image} alt={`Banner ${banner.order}`} />
                                <div className="banner-tag">Order: {banner.order}</div>
                                {banner.bannerMobile && (
                                    <div className="mobile-indicator" title="Mobile banner available">
                                        <i className="bi bi-phone"></i>
                                    </div>
                                )}
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
                .shop-banners-container { width: 100%; }
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
                .mobile-indicator { position: absolute; top: 12px; right: 12px; background: #ffc451; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                
                .banner-actions { padding: 1rem; display: flex; gap: 0.5rem; }
                .banner-actions button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.9rem; }
                .edit-btn:hover { background: #f8fafc; color: #ffc451; border-color: #ffc451; }
                .delete-btn:hover { background: #fef2f2; color: #dc2626; border-color: #dc2626; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .confirm-modal { background: #fff; padding: 2.5rem; border-radius: 28px; width: 100%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                .hero-edit-modal { text-align: left; }
                .hero-edit-modal h3 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
                .modal-subtitle { color: #64748b; font-size: 0.9rem; margin-bottom: 2rem; }
                .hero-form { margin-top: 1rem; }
                
                .banner-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .input-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
                .input-group label { display: block; font-weight: 700; color: #475569; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.025em; }
                .input-group input { width: 100%; padding: 0.875rem 1rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; transition: all 0.2s; }
                .input-group input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }
                
                .banner-upload-box { width: 100%; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; position: relative; transition: all 0.3s; }
                .banner-upload-box.desktop { height: 160px; }
                .banner-upload-box.mobile { height: 160px; }
                .banner-upload-box:hover { border-color: #ffc451; background: #fff9ed; }
                .banner-upload-box img { width: 100%; height: 100%; object-fit: cover; }
                
                .upload-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #fff; opacity: 0; transition: 0.2s; }
                .banner-upload-box:hover .upload-overlay { opacity: 1; }
                .upload-overlay i { font-size: 1.5rem; }
                .upload-overlay span { font-weight: 600; font-size: 0.85rem; }

                .banner-upload-box .placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; color: #64748b; text-align: center; padding: 1rem; }
                .banner-upload-box .placeholder i { font-size: 1.8rem; color: #ffc451; }
                .banner-upload-box .placeholder span { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
                .banner-upload-box .placeholder small { font-size: 0.7rem; color: #94a3b8; }
                
                .modal-footer { display: flex; gap: 1rem; margin-top: 2rem; }
                .modal-footer button { flex: 1; padding: 1rem; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
                
                .cancel-btn { background: #f1f5f9; color: #64748b; border: none; }
                .cancel-btn:hover { background: #e2e8f0; color: #1e293b; }
                
                .save-btn { background: #ffc451; color: #fff; border: none; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.3); }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(255, 196, 81, 0.4); }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
                
                .hidden { display: none; }
                .empty-state { grid-column: 1 / -1; padding: 4rem; text-align: center; color: #94a3b8; background: #fff; border-radius: 24px; border: 1px dashed #e2e8f0; }
                .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
                
                @media (max-width: 600px) {
                    .banner-fields-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
