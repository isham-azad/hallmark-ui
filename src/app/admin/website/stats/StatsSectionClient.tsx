"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStatsSection } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

interface StatItem {
    icon: string;
    value: string;
    label: string;
}

interface StatsData {
    title: string;
    description: string;
    image: string;
    stats: StatItem[];
}

interface StatsSectionClientProps {
    initialData: any;
    liveCounts: {
        products: number;
        categories: number;
    };
}

export default function StatsSectionClient({ initialData, liveCounts }: StatsSectionClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    
    const defaultData: StatsData = {
        title: "Trusted by homes across India & the Gulf",
        description: "Since 2014, Hallmark Enterprises has been delivering high-quality, affordable essentials with a commitment to value, satisfaction, and happiness—every single day.",
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566392/hallmark/assets/img/stats-img.jpg",
        stats: [
            { icon: "emoji-smile", value: "10", label: "Years of Excellence" },
            { icon: "box-seam", value: "26", label: "Products & Growing" },
            { icon: "shop", value: "7", label: "Product Categories" },
            { icon: "people", value: "25", label: "Years of Industry Experience" }
        ]
    };

    const [formData, setFormData] = useState<StatsData>(() => {
        if (!initialData || !initialData.stats) return defaultData;
        return {
            ...defaultData,
            ...initialData,
            stats: initialData.stats || defaultData.stats
        };
    });
    
    // Sync local state when props change (after router.refresh())
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultData,
                ...initialData,
                stats: initialData.stats || defaultData.stats
            });
        }
    }, [initialData]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(formData.image);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleStatChange = (index: number, field: keyof StatItem, val: string) => {
        const newStats = [...formData.stats];
        newStats[index][field] = val;
        setFormData({ ...formData, stats: newStats });
    };



    // Stats whose value is auto-fetched from the DB (products / categories count)
    const isAutoCount = (label: string) => {
        const lbl = label.toLowerCase();
        return (lbl.includes("product") && !lbl.includes("categor")) || lbl.includes("categor");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image;
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("images", imageFile);
                uploadFormData.append("folder", "website");
                const res = await fetch("/api/admin/website/upload", { method: "POST", body: uploadFormData });
                const result = await res.json();
                if (result.success && result.urls.length > 0) imageUrl = result.urls[0];
                else throw new Error(result.error || "Upload failed");
            }

            const res = await updateStatsSection({ 
                title: formData.title,
                description: formData.description,
                image: imageUrl,
                stats: formData.stats
            });
            if (res.success) {
                showToast("Stats Section updated successfully");
                router.refresh();
            } else {
                showToast(res.error || "Failed to update", "error");
            }
        } catch (error: any) {
            showToast(error.message, "error");
        }
        setLoading(false);
    };

    return (
        <div className="stats-section-container">
            {ToastComponent}
            <div className="section-header">
                <h3>Stats Section Management</h3>
                <p>Edit the numbers and content for the homepage stats section.</p>
            </div>

            <form onSubmit={handleSubmit} className="stats-form">
                <div className="form-layout">
                    <div className="left-side">
                        <div className="form-card">
                            <h4>Main Content</h4>
                            <div className="input-group">
                                <label>Section Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea 
                                    rows={4} 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-card mt-4">
                            <div className="card-header">
                                <h4>Key Statistics</h4>
                            </div>
                            <div className="stats-grid">
                                {formData.stats.map((stat, i) => (
                                    <div key={i} className="stat-item-card">
                                        <div className="row g-3 align-items-end">
                                            <div className="col-md-7">
                                                <div className="input-group mb-0">
                                                    <label className="stats-label">Icon (Bootstrap Icon)</label>
                                                    <div className="icon-input" style={{ minHeight: '48px', position: 'relative' }}>
                                                        <i className={`bi bi-${stat.icon}`} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ffc451', fontSize: '1.2rem', zIndex: 1, pointerEvents: 'none' }}></i>
                                                        <input 
                                                            type="text" 
                                                            value={stat.icon} 
                                                            onChange={(e) => handleStatChange(i, "icon", e.target.value)} 
                                                            placeholder="emoji-smile, shop, etc..."
                                                            style={{ paddingLeft: '40px', height: '48px', width: '100%' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-5">
                                                <div className="input-group mb-0">
                                                    <label className="stats-label d-flex align-items-center">Value</label>
                                                    {isAutoCount(stat.label) ? (
                                                        <div className="live-count-wrapper">
                                                            <div className="live-count-status">
                                                                <span className="pulse-dot"></span>
                                                                <i className="bi bi-lightning-fill"></i>
                                                                <span>Live</span>
                                                            </div>
                                                            <div className="live-count-box">
                                                                <i className="bi bi-database-check"></i>
                                                                <span className="count">
                                                                    {stat.label.toLowerCase().includes("categor") 
                                                                        ? (liveCounts.categories ?? 0)
                                                                        : (liveCounts.products ?? 0)
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            type="text" 
                                                            value={stat.value} 
                                                            onChange={(e) => handleStatChange(i, "value", e.target.value)} 
                                                            placeholder="e.g. 10+"
                                                            style={{ height: '48px', width: '100%' }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="input-group mb-0 mt-3">
                                                    <label className="stats-label">Display Label</label>
                                                    <input 
                                                        type="text" 
                                                        value={stat.label} 
                                                        onChange={(e) => handleStatChange(i, "label", e.target.value)} 
                                                        placeholder="e.g. Years of Excellence"
                                                        style={{ height: '48px', width: '100%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="right-side">
                        <div className="form-card sticky">
                            <h4>Section Image</h4>
                            <div className="image-upload-box" onClick={() => fileInputRef.current?.click()}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Stats" />
                                ) : (
                                    <div className="placeholder">
                                        <i className="bi bi-cloud-upload"></i>
                                        <span>Click to upload image</span>
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
                            <p className="hint">Recommended size: 600x600px square image.</p>
                            
                            <div className="form-actions-sticky">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .stats-section-container { width: 100%; }
                .section-header { margin-bottom: 2rem; }
                .section-header h3 { font-size: 1.5rem; color: #0f172a; font-weight: 700; margin-bottom: 0.25rem; }
                
                .form-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
                .form-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .form-card h4 { font-size: 1.125rem; margin-bottom: 0; color: #0f172a; }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
                
                .sticky { position: sticky; top: 100px; }
                
                .input-group { margin-bottom: 1.25rem; }
                .input-group label, .stats-label { 
                    display: flex; 
                    align-items: center; 
                    height: 24px; 
                    margin-bottom: 0.5rem; 
                    font-weight: 600; 
                    color: #64748b; 
                    font-size: 0.875rem; 
                }
                .input-group input, .input-group textarea { width: 100%; height: 48px; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; transition: 0.2s; }
                .input-group input:focus, .input-group textarea:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }
                
                .icon-input { display: flex; align-items: center; gap: 0.75rem; }
                .icon-input i { font-size: 1.5rem; color: #ffc451; width: 24px; text-align: center; }
                
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .stat-item-card { background: #f8fafc; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; }
                .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .stat-header h5 { margin: 0; font-size: 0.9rem; color: #1e293b; }
                .remove-btn { color: #ef4444; background: none; border: none; cursor: pointer; padding: 4px; font-size: 1.1rem; }
                
                .add-point-btn { background: #f0fdfa; color: #0d9488; border: 1px solid #0d9488; padding: 8px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }
                .add-point-btn:hover:not(:disabled) { background: #ccfbf1; }
                .add-point-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .live-count-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 48px;
                    width: 100%;
                }

                .live-count-status {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #f0fdf4;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    border: 1px solid #dcfce7;
                    height: 28px;
                    white-space: nowrap;
                }

                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: #22c55e;
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .live-count-box {
                    flex: 1;
                    height: 48px;
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                    border: 1px solid #bbf7d0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                .live-count-box i {
                    font-size: 1.1rem;
                    color: #22c55e;
                }

                .live-count-box .count {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #166534;
                }

                .image-upload-box { border: 2px dashed #e2e8f0; background: #f8fafc; border-radius: 16px; height: 250px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
                .image-upload-box img { width: 100%; height: 100%; object-fit: cover; }
                
                .save-btn { width: 100%; padding: 12px; background: #ffc451; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 1.5rem; }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,196,81,0.25); }
                
                .hidden { display: none; }
                .mt-4 { margin-top: 1.5rem; }
                
                @media (max-width: 992px) {
                    .form-layout { grid-template-columns: 1fr; }
                    .stats-grid { grid-template-columns: 1fr; }
                    .sticky { position: static; }
                }
            `}</style>
        </div>
    );
}
