"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/AdminToast";
import SearchableSelect from "../SearchableSelect";

const MAX_IMAGES = 5;

interface Brand { id: string; name: string; }
interface Category { id: string; name: string; }

interface Product {
    id: string;
    title: string;
    desc: string;
    image: string | null;
    price: string | null;
    wasPrice: string | null;
    brandId: string;
    categoryId: string;
    sku: string | null;
    stock: number;
}

interface ProductEditClientProps {
    product: Product;
    brands: Brand[];
    categories: Category[];
}

export default function ProductEditClient({ product, brands, categories }: ProductEditClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const initialExisting = (product.image ?? "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

    const [formData, setFormData] = useState({
        title: product.title,
        desc: product.desc,
        price: product.price || "",
        wasPrice: product.wasPrice || "",
        sku: product.sku || "",
        stock: product.stock.toString(),
        brandId: product.brandId,
        categoryId: product.categoryId,
    });
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialExisting);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalImageCount = existingImageUrls.length + imageFiles.length;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const valid = files.filter((f) => f.type.startsWith("image/"));
        const slotsLeft = MAX_IMAGES - totalImageCount;
        const toAdd = valid.slice(0, slotsLeft);
        setImageFiles((prev) => [...prev, ...toAdd].slice(0, MAX_IMAGES - existingImageUrls.length));
        setImagePreviews((prev) => {
            const newUrls = toAdd.map((f) => URL.createObjectURL(f));
            return [...prev, ...newUrls].slice(0, MAX_IMAGES - existingImageUrls.length);
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeExistingImage = (index: number) => {
        setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const form = new FormData();
        form.set("id", product.id);
        form.set("title", formData.title);
        form.set("desc", formData.desc);
        form.set("brandId", formData.brandId);
        form.set("categoryId", formData.categoryId);
        form.set("price", formData.price);
        form.set("wasPrice", formData.wasPrice);
        form.set("sku", formData.sku);
        form.set("stock", formData.stock);
        form.set("existingImages", existingImageUrls.join(","));
        imageFiles.forEach((file) => form.append("images", file));

        try {
            const res = await fetch("/api/admin/products/update", {
                method: "POST",
                body: form,
            });
            const result = await res.json();

            if (result.success) {
                showToast("Product updated successfully!");
                setTimeout(() => router.push("/admin/products"), 1000);
            } else {
                showToast(result.error || "Failed to update product", "error");
            }
        } catch {
            showToast("Failed to update product", "error");
        }
        setLoading(false);
    };

    return (
        <div className="edit-product-container">
            {ToastComponent}
            <div className="header-actions mb-4">
                <Link href="/admin/products" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-sections">
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="input-group">
                            <label>Product Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Soph Dishwash Liquid"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Description</label>
                            <textarea
                                rows={4}
                                placeholder="Product details, features, etc..."
                                value={formData.desc}
                                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Categorization, Pricing & Inventory</h3>
                        <div className="grid-2">
                            <div className="input-group">
                                <label>Brand</label>
                                <SearchableSelect
                                    id="brand-edit"
                                    options={brands}
                                    value={formData.brandId}
                                    onChange={(brandId) => setFormData({ ...formData, brandId })}
                                    placeholder="Select brand"
                                />
                            </div>
                            <div className="input-group">
                                <label>Category</label>
                                <SearchableSelect
                                    id="category-edit"
                                    options={categories}
                                    value={formData.categoryId}
                                    onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                                    placeholder="Select category"
                                />
                            </div>
                            <div className="input-group">
                                <label>Price (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="₹0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Was Price (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="₹0.00"
                                    value={formData.wasPrice}
                                    onChange={(e) => setFormData({ ...formData, wasPrice: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>SKU (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HM-1002"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Stock Level</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Media</h3>
                        <div className="input-group">
                            <label>Product Images (max {MAX_IMAGES})</label>
                            <p className="media-hint">Images are saved under hallmark/products/[SKU or ID]/</p>

                            {existingImageUrls.length > 0 && (
                                <div className="current-images-block">
                                    <span className="current-images-label">Current images — click Remove to drop from product</span>
                                    <div className="preview-grid">
                                        {existingImageUrls.map((url, i) => (
                                            <div key={`ex-${i}-${url}`} className="preview-item existing">
                                                <img src={url} alt={`Current ${i + 1}`} className="img-preview" />
                                                <button
                                                    type="button"
                                                    className="remove-preview"
                                                    onClick={() => removeExistingImage(i)}
                                                    title="Remove this image"
                                                    aria-label="Remove image"
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="file-input"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                className="upload-trigger"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={totalImageCount >= MAX_IMAGES}
                            >
                                <i className="bi bi-cloud-upload"></i>
                                {totalImageCount >= MAX_IMAGES
                                    ? `${MAX_IMAGES} images`
                                    : existingImageUrls.length > 0
                                        ? `Add more images (${totalImageCount}/${MAX_IMAGES})`
                                        : `Choose images (${totalImageCount}/${MAX_IMAGES})`}
                            </button>

                            {imagePreviews.length > 0 && (
                                <div className="new-images-block">
                                    <span className="new-images-label">New images (saved when you click Update)</span>
                                    <div className="preview-grid">
                                        {imagePreviews.map((url, i) => (
                                            <div key={url} className="preview-item new">
                                                <img src={url} alt={`New ${i + 1}`} className="img-preview" />
                                                <button
                                                    type="button"
                                                    className="remove-preview"
                                                    onClick={() => removeNewImage(i)}
                                                    title="Remove this image"
                                                    aria-label="Remove image"
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => router.push("/admin/products")} className="discard-btn">Cancel</button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Product"}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .edit-product-container { max-width: 900px; }
        .back-link { display: flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none; font-weight: 600; }
        .back-link:hover { color: #ffc451; }
        
        .form-section { background: #fff; padding: 2rem; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 1.5rem; }
        .form-section h3 { font-size: 1.125rem; margin-bottom: 1.5rem; color: #0f172a; }
        
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .input-group label { font-size: 0.875rem; color: #64748b; font-weight: 500; }
        
        input, textarea, select { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.9375rem; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .media-hint { font-size: 0.8125rem; color: #94a3b8; margin: 0 0 0.5rem 0; }
        .current-images-block { margin-bottom: 1.25rem; }
        .current-images-label { font-size: 0.8125rem; color: #0d9488; font-weight: 600; display: block; margin-bottom: 0.5rem; }
        .new-images-block { margin-top: 1rem; }
        .new-images-label { font-size: 0.8125rem; color: #6366f1; font-weight: 600; display: block; margin-bottom: 0.5rem; }
        .file-input { position: absolute; width: 0.1px; height: 0.1px; opacity: 0; overflow: hidden; z-index: -1; }
        .upload-trigger { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 12px; color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 0.5rem; }
        .upload-trigger:hover:not(:disabled) { background: #f1f5f9; border-color: #ffc451; color: #ffc451; }
        .upload-trigger:disabled { opacity: 0.7; cursor: not-allowed; }
        .preview-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; }
        .preview-item { position: relative; }
        .preview-item.existing .img-preview { border-color: #0d9488; box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2); }
        .img-preview { width: 100px; height: 100px; object-fit: cover; border-radius: 12px; border: 1px solid #f1f5f9; display: block; background: #f8fafc; }
        .remove-preview { position: absolute; top: 4px; right: 4px; min-width: 28px; height: 28px; padding: 0 8px; border-radius: 8px; border: none; background: rgba(239, 68, 68, 0.95); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.7rem; font-weight: 600; }
        .remove-preview:hover { background: #dc2626; }
        
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; }
        .discard-btn { padding: 0.75rem 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .discard-btn:hover { background: #f1f5f9; color: #475569; }
        .save-btn { padding: 0.75rem 2rem; background: #ffc451; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .save-btn:hover { background: #f8b42d; transform: translateY(-1px); }

        @media (max-width: 768px) {
            .form-section { padding: 1.5rem; }
            .grid-2 { grid-template-columns: 1fr; gap: 1rem; }
            .form-actions { flex-direction: column; }
            .form-actions button { width: 100%; }
            .preview-grid { justify-content: center; }
        }
      `}</style>
        </div>
    );
}
