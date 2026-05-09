"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/AdminToast";

export default function BrandAddClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast, ToastComponent } = useAdminToast();

    const [formData, setFormData] = useState({
        name: "",
        shortDesc: "",
        summary: "",
        website: "",
        status: "active",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
    const [bannerFiles, setBannerFiles] = useState<File[]>([]);
    const [bannerPreviewUrls, setBannerPreviewUrls] = useState<string[]>([]);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [bannerMobileFiles, setBannerMobileFiles] = useState<File[]>([]);
    const [bannerMobilePreviewUrls, setBannerMobilePreviewUrls] = useState<string[]>([]);
    const bannerMobileInputRef = useRef<HTMLInputElement>(null);

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

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - bannerFiles.length);

        if (validFiles.length === 0) return;

        const newUrls = validFiles.map(f => URL.createObjectURL(f));
        setBannerFiles(prev => [...prev, ...validFiles]);
        setBannerPreviewUrls(prev => [...prev, ...newUrls]);
        if (bannerInputRef.current) bannerInputRef.current.value = "";
    };

    const removeBanner = (index: number) => {
        URL.revokeObjectURL(bannerPreviewUrls[index]);
        setBannerFiles(prev => prev.filter((_, i) => i !== index));
        setBannerPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleBannerMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - bannerMobileFiles.length);

        if (validFiles.length === 0) return;

        const newUrls = validFiles.map(f => URL.createObjectURL(f));
        setBannerMobileFiles(prev => [...prev, ...validFiles]);
        setBannerMobilePreviewUrls(prev => [...prev, ...newUrls]);
        if (bannerMobileInputRef.current) bannerMobileInputRef.current.value = "";
    };

    const removeBannerMobile = (index: number) => {
        URL.revokeObjectURL(bannerMobilePreviewUrls[index]);
        setBannerMobileFiles(prev => prev.filter((_, i) => i !== index));
        setBannerMobilePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const form = new FormData();
            form.set("name", formData.name);
            form.set("shortDesc", formData.shortDesc);
            form.set("summary", formData.summary);
            if (imageFile) form.set("image", imageFile);

            bannerFiles.forEach(f => form.append("banner", f));
            bannerMobileFiles.forEach(f => form.append("bannerMobile", f));

            const res = await fetch("/api/admin/brands/create", { method: "POST", body: form });
            const result = await res.json();

            if (result.success) {
                showToast("Brand added successfully!");
                setTimeout(() => router.push("/admin/brands"), 1000);
            } else {
                showToast(result.error || "Failed to add brand", "error");
            }
        } catch {
            showToast("Failed to add brand", "error");
        }
        setLoading(false);
    };

    return (
        <div className="add-brand-container">
            {ToastComponent}
            <div className="header-actions mb-4">
                <Link href="/admin/brands" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Brands
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="brand-form">
                <div className="form-sections">
                    <div className="form-section main-info">
                        <h3>Brand Information</h3>
                        <div className="input-group">
                            <label>Brand Name</label>
                            <input
                                type="text"
                                placeholder="e.g. River Hill Tea"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Short Description (For Homepage Cards)</label>
                            <input
                                type="text"
                                placeholder="e.g. Quality essentials for your home..."
                                value={formData.shortDesc}
                                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Detailed Brand Summary</label>
                            <textarea
                                placeholder="Brief description of the brand and its core values..."
                                rows={5}
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                required
                            ></textarea>
                        </div>
                    </div>

                    <div className="form-section branding-info">
                        <h3>Identity & Status</h3>
                        <div className="grid-inputs">
                            <div className="input-group">
                                <label>Brand Logo / Image (500 x 500 px)</label>
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
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={removeImage}
                                    >
                                        Remove image
                                    </button>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Desktop Banners (Up to 5 images, 1920 x 650 px)</label>
                                <div className="multi-banner-container">
                                    <div className="banners-grid">
                                        {bannerPreviewUrls.map((url, i) => (
                                            <div key={i} className="banner-card">
                                                <img src={url} alt={`Banner ${i + 1}`} className="banner-img" />
                                                <button type="button" className="remove-banner-btn" onClick={(e) => { e.stopPropagation(); removeBanner(i); }}>
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </div>
                                        ))}

                                        {bannerFiles.length < 5 && (
                                            <div
                                                className="add-banner-card"
                                                onClick={() => bannerInputRef.current?.click()}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <input
                                                    ref={bannerInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleBannerChange}
                                                    className="hidden-input"
                                                />
                                                <i className="bi bi-plus-lg"></i>
                                                <span>Add Banner</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Mobile Banners (Up to 5 images, 800 x 500 px)</label>
                                <div className="multi-banner-container">
                                    <div className="banners-grid">
                                        {bannerMobilePreviewUrls.map((url, i) => (
                                            <div key={i} className="banner-card mobile-banner-card">
                                                <img src={url} alt={`Mobile Banner ${i + 1}`} className="banner-img" />
                                                <button type="button" className="remove-banner-btn" onClick={(e) => { e.stopPropagation(); removeBannerMobile(i); }}>
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </div>
                                        ))}

                                        {bannerMobileFiles.length < 5 && (
                                            <div
                                                className="add-banner-card mobile-banner-card"
                                                onClick={() => bannerMobileInputRef.current?.click()}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <input
                                                    ref={bannerMobileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleBannerMobileChange}
                                                    className="hidden-input"
                                                />
                                                <i className="bi bi-plus-lg"></i>
                                                <span>Add Mobile</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="side-inputs">
                                <div className="input-group">
                                    <label>Official Website (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => router.push("/admin/brands")} className="cancel-btn">
                        Discard
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Saving..." : "Save Brand"}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .add-brand-container {
          max-width: 1000px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .back-link:hover {
          color: #ffc451;
        }

        .brand-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section {
          background: #fff;
          padding: 2rem;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
        }

        .form-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #1e293b;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }

        input, textarea, select {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 0.9375rem;
          background: #f8fafc;
          transition: all 0.3s;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #ffc451;
          box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
        }

        .grid-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .upload-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .upload-zone:hover {
          border-color: #ffc451;
        }

        .hidden-input {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
        }

        .upload-zone .preview-img {
          max-width: 100%;
          max-height: 120px;
          object-fit: contain;
        }

        .upload-zone i {
          font-size: 2rem;
          color: #ffc451;
        }

        .banner-zone {
            grid-column: span 2;
            min-height: 180px;
        }

        .banner-preview {
            max-height: 160px !important;
            width: 100%;
            object-fit: cover !important;
            border-radius: 8px;
        }

        .upload-zone span {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.8rem;
        }

        .remove-image-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: #ef4444;
          background: transparent;
          border: 1px solid #fecaca;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .remove-image-btn:hover {
          background: #fef2f2;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 2rem;
        }

        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
        }

        .save-btn {
          padding: 0.75rem 2rem;
          background: #ffc451;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
        }

        .multi-banner-container {
            width: 100%;
            grid-column: span 2;
        }

        .banners-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 0.5rem;
        }

        .banner-card, .add-banner-card {
            position: relative;
            aspect-ratio: 16/9;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-banner-card {
            aspect-ratio: 8/5;
        }

        .add-banner-card {
            border: 2px dashed #e2e8f0;
            color: #64748b;
            gap: 0.5rem;
        }

        .add-banner-card:hover {
            border-color: #ffc451;
            background: #fff;
            color: #ffc451;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .add-banner-card i {
            font-size: 1.5rem;
        }

        .add-banner-card span {
            font-size: 0.85rem;
            font-weight: 600;
        }

        .banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .remove-banner-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            border: none;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            cursor: pointer;
            transition: 0.2s;
            backdrop-filter: blur(4px);
            z-index: 5;
        }

        .remove-banner-btn:hover {
            background: #ef4444;
            transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .grid-inputs {
            grid-template-columns: 1fr;
          }
          .banners-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
        </div>
    );
}
