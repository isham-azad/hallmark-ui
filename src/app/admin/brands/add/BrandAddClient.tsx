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
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("");
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
    const [bannerMobilePreviewUrl, setBannerMobilePreviewUrl] = useState<string>("");
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
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
        setBannerFile(file);
        setBannerPreviewUrl(URL.createObjectURL(file));
        if (bannerInputRef.current) bannerInputRef.current.value = "";
    };

    const removeBanner = () => {
        if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
        setBannerFile(null);
        setBannerPreviewUrl("");
    };

    const handleBannerMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        if (bannerMobilePreviewUrl) URL.revokeObjectURL(bannerMobilePreviewUrl);
        setBannerMobileFile(file);
        setBannerMobilePreviewUrl(URL.createObjectURL(file));
        if (bannerMobileInputRef.current) bannerMobileInputRef.current.value = "";
    };

    const removeBannerMobile = () => {
        if (bannerMobilePreviewUrl) URL.revokeObjectURL(bannerMobilePreviewUrl);
        setBannerMobileFile(null);
        setBannerMobilePreviewUrl("");
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
            if (bannerFile) form.set("banner", bannerFile);
            if (bannerMobileFile) form.set("bannerMobile", bannerMobileFile);

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
                                <label>Desktop Banner (1920 x 450 px)</label>
                                <div
                                    className="upload-zone banner-zone"
                                    onClick={() => bannerInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && bannerInputRef.current?.click()}
                                >
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                        className="hidden-input"
                                    />
                                    {bannerPreviewUrl ? (
                                        <>
                                            <img src={bannerPreviewUrl} alt="Banner Preview" className="preview-img banner-preview" />
                                            <span>Click to change desktop banner</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-aspect-ratio"></i>
                                            <span>Choose desktop banner</span>
                                        </>
                                    )}
                                </div>
                                {bannerFile && (
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={removeBanner}
                                    >
                                        Remove desktop banner
                                    </button>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Mobile Banner (800 x 500 px)</label>
                                <div
                                    className="upload-zone banner-zone"
                                    onClick={() => bannerMobileInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && bannerMobileInputRef.current?.click()}
                                >
                                    <input
                                        ref={bannerMobileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerMobileChange}
                                        className="hidden-input"
                                    />
                                    {bannerMobilePreviewUrl ? (
                                        <>
                                            <img src={bannerMobilePreviewUrl} alt="Mobile Banner Preview" className="preview-img banner-preview" />
                                            <span>Click to change mobile banner</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-phone"></i>
                                            <span>Choose mobile banner</span>
                                        </>
                                    )}
                                </div>
                                {bannerMobileFile && (
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={removeBannerMobile}
                                    >
                                        Remove mobile banner
                                    </button>
                                )}
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

        @media (max-width: 768px) {
          .grid-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
