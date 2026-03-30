"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateBrand } from "../../actions";
import { useAdminToast } from "@/components/AdminToast";

interface Brand {
  id: string;
  name: string;
  summary: string;
  image: string | null;
  banner: string | null;
}

interface BrandEditClientProps {
  brand: Brand;
}

export default function BrandEditClient({ brand }: BrandEditClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast, ToastComponent } = useAdminToast();

  const [formData, setFormData] = useState({
    name: brand.name,
    summary: brand.summary,
    website: "",
    status: "active",
    image: brand.image || "",
    banner: brand.banner || ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const displayImageUrl = imagePreviewUrl || formData.image;
  const displayBannerUrl = bannerPreviewUrl || formData.banner;

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
    setFormData((prev) => ({ ...prev, image: "" }));
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
    setFormData((prev) => ({ ...prev, banner: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (imageFile || bannerFile) {
        const form = new FormData();
        form.set("id", brand.id);
        form.set("name", formData.name);
        form.set("summary", formData.summary);
        if (imageFile) form.set("image", imageFile);
        if (bannerFile) form.set("banner", bannerFile);
        
        const res = await fetch("/api/admin/brands/update", { method: "POST", body: form });
        const result = await res.json();
        if (result.success) {
          showToast("Brand updated successfully!");
          setTimeout(() => router.push("/admin/brands"), 1000);
        } else {
          showToast(result.error || "Failed to update brand", "error");
        }
      } else {
        const result = await updateBrand(brand.id, {
          name: formData.name,
          summary: formData.summary,
          image: formData.image || undefined,
          banner: formData.banner || undefined
        });
        if (result.success) {
          showToast("Brand updated successfully!");
          setTimeout(() => router.push("/admin/brands"), 1000);
        } else {
          showToast(result.error || "Failed to update brand", "error");
        }
      }
    } catch {
      showToast("Failed to update brand", "error");
    }
    setLoading(false);
  };

  return (
    <div className="edit-brand-container">
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
            <div className="section-header">
              <h3>Edit Brand</h3>
              <p>Update brand identity and details</p>
            </div>

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
              <label>Brand Summary</label>
              <textarea
                placeholder="Brief description of the brand..."
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
                <label>Brand Logo / Image</label>
                <div
                  className="upload-zone existing"
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
                  {displayImageUrl ? (
                    <>
                      <img src={displayImageUrl} alt="Current Logo" className="preview-img" />
                      <div className="upload-overlay">
                        <i className="bi bi-image"></i>
                        <span>Change (uploaded on Save)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="no-image-placeholder">{formData.name[0] || "?"}</div>
                      <div className="upload-overlay">
                        <i className="bi bi-image"></i>
                        <span>Choose image (uploaded on Save)</span>
                      </div>
                    </>
                  )}
                </div>
                {displayImageUrl && (
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
                <label>Brand Banner (Header Background)</label>
                <div
                  className="upload-zone banner-zone existing"
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
                  {displayBannerUrl ? (
                    <>
                      <img src={displayBannerUrl} alt="Current Banner" className="preview-img banner-preview" />
                      <div className="upload-overlay">
                        <i className="bi bi-aspect-ratio"></i>
                        <span>Change Banner (uploaded on Save)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="no-image-placeholder banner-placeholder">
                        <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                      </div>
                      <div className="upload-overlay">
                        <i className="bi bi-aspect-ratio"></i>
                        <span>Choose Banner (uploaded on Save)</span>
                      </div>
                    </>
                  )}
                </div>
                {displayBannerUrl && (
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={removeBanner}
                  >
                    Remove banner
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
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Brand"}
          </button>
        </div>
      </form>


      <style jsx>{`
        .no-image-placeholder {
            width: 100%;
            height: 100%;
            background: #ffc451;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: bold;
        }

        .edit-brand-container {
          max-width: 1000px;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .back-link {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          color: #64748b !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          transition: 0.2s !important;
          margin-bottom: 2rem !important;
        }

        .back-link:hover {
          color: #ffc451 !important;
        }

        .section-header {
           margin-bottom: 2rem;
        }

        .section-header h3 {
           font-size: 1.5rem !important;
           margin-bottom: 0.25rem !important;
        }

        .section-header p {
           color: #64748b;
           margin: 0;
        }

        .form-section {
          background: #fff;
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          margin-bottom: 2rem;
        }

        .form-section h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #0f172a;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        input, textarea, select {
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 0.9375rem;
          background: #f8fafc;
          transition: all 0.2s;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #ffc451 !important;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
        }

        .grid-inputs {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 2.5rem;
        }

        .upload-zone.existing {
          width: 200px;
          height: 200px;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
        }

        .hidden-input {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
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

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 1.5rem;
        }

        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #fff;
          opacity: 0;
          transition: 0.2s;
          cursor: pointer;
        }

        .upload-zone.existing:hover .upload-overlay {
          opacity: 1;
        }

        .upload-overlay i {
          font-size: 1.5rem;
        }

        .banner-zone {
            width: 100% !important;
            grid-column: span 2;
            height: 180px !important;
        }

        .banner-preview {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            padding: 0 !important;
        }

        .banner-placeholder {
            height: 100% !important;
            font-size: 1.5rem !important;
            background: #f1f5f9 !important;
            color: #94a3b8 !important;
        }

        .upload-overlay span {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 2rem 0;
        }

        .cancel-btn {
          padding: 0.875rem 2rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #f1f5f9;
        }

        .save-btn {
          padding: 0.875rem 2.5rem;
          background: #ffc451;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(255, 196, 81, 0.3);
        }

        .save-btn:hover {
          background: #f8b42d;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 196, 81, 0.4);
        }

        @media (max-width: 768px) {
          .grid-inputs {
            grid-template-columns: 1fr;
          }
          .upload-zone.existing {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
