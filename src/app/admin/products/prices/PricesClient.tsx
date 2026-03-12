"use client";

import { useState, useMemo, useEffect } from "react";
import { updateProductPrice, bulkUpdatePrices } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

const BULK_PRICES_CSV_TEMPLATE = "sku,price,wasPrice\nHM-001,299,399\nHM-002,149,199\nHM-003,99,";

interface Product {
    id: string;
    title: string;
    sku: string | null;
    price: string | null;
    wasPrice: string | null;
}

interface PricesClientProps {
    products: Product[];
}

export default function PricesClient({ products }: PricesClientProps) {
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkType, setBulkType] = useState<"percentage" | "fixed">("percentage");
    const [bulkValue, setBulkValue] = useState("");
    const [isApplyingBulk, setIsApplyingBulk] = useState(false);
    const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkUploadResult, setBulkUploadResult] = useState<{ updated: number; errors: string[] } | null>(null);

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

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(
            p =>
                p.title.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query) ||
                (p.sku && p.sku.toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleUpdatePrice = async (id: string, price: string, wasPrice: string) => {
        setLoading(id);
        const result = await updateProductPrice(id, price, wasPrice);
        setLoading(null);
        if (result.success) {
            showToast("Price updated successfully");
        } else {
            showToast(result.error || "Failed to update price", "error");
        }
    };

    const handleBulkUpdate = async () => {
        const val = parseFloat(bulkValue);
        if (isNaN(val) || val <= 0) {
            showToast("Please enter a valid amount", "error");
            return;
        }

        setIsApplyingBulk(true);
        const result = await bulkUpdatePrices(bulkType, val);
        setIsApplyingBulk(false);

        if (result.success) {
            showToast("Bulk discount applied successfully");
            setShowBulkModal(false);
            setBulkValue("");
        } else {
            showToast(result.error || "Failed to apply discount", "error");
        }
    };

    const downloadPricesTemplate = () => {
        const blob = new Blob([BULK_PRICES_CSV_TEMPLATE], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "prices-upload-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkUploadPrices = async () => {
        if (!bulkFile) {
            showToast("Please select a CSV file", "error");
            return;
        }
        setBulkUploading(true);
        setBulkUploadResult(null);
        try {
            const form = new FormData();
            form.set("file", bulkFile);
            const res = await fetch("/api/admin/prices/bulk", { method: "POST", body: form });
            const data = await res.json();
            if (data.success) {
                setBulkUploadResult({ updated: data.updated, errors: data.errors || [] });
                showToast(`Bulk prices: ${data.updated} product(s) updated`);
                setBulkFile(null);
                if (data.updated > 0) setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.error || "Bulk update failed", "error");
            }
        } catch {
            showToast("Bulk update failed", "error");
        }
        setBulkUploading(false);
    };

    const closeBulkUploadModal = () => {
        setBulkUploadModalOpen(false);
        setBulkFile(null);
        setBulkUploadResult(null);
    };

    return (
        <div className="prices-container">
            {ToastComponent}
            <div className="prices-header">
                <div className="header-info">
                    <h3>Pricing Management</h3>
                    <p>Update product prices and manage discounts across your catalog.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="bulk-upload-prices-btn" onClick={() => setBulkUploadModalOpen(true)}>
                        <i className="bi bi-upload"></i>
                        Bulk upload prices
                    </button>
                    <button className="bulk-update-btn" onClick={() => setShowBulkModal(true)}>
                        <i className="bi bi-percent"></i>
                        Bulk Discount
                    </button>
                </div>
            </div>

            <div className="pricing-grid">
                {currentItems.map((product) => (
                    <PriceCard
                        key={product.id}
                        product={product}
                        onUpdate={handleUpdatePrice}
                        isLoading={loading === product.id}
                    />
                ))}
                {filteredProducts.length === 0 && (
                    <div className="no-results">
                        <p>No products found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        type="button"
                        className="pager-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            type="button"
                            className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="pager-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            )}

            {bulkUploadModalOpen && (
                <div className="modal-overlay" onClick={closeBulkUploadModal}>
                    <div className="modal-content bulk-upload-modal" onClick={e => e.stopPropagation()}>
                        <h3>Bulk upload prices</h3>
                        <p>Upload a CSV with columns <strong>sku</strong>, <strong>price</strong>, and optional <strong>wasPrice</strong>. Products are matched by SKU.</p>
                        <div className="bulk-upload-actions">
                            <button type="button" className="template-download-btn" onClick={downloadPricesTemplate}>
                                <i className="bi bi-download"></i> Download template
                            </button>
                            <div className="file-input-wrap">
                                <input
                                    type="file"
                                    accept=".csv"
                                    id="bulk-prices-csv"
                                    className="file-input"
                                    onChange={(e) => {
                                        setBulkFile(e.target.files?.[0] ?? null);
                                        setBulkUploadResult(null);
                                    }}
                                />
                                <label htmlFor="bulk-prices-csv" className="file-label">
                                    {bulkFile ? bulkFile.name : "Choose CSV file"}
                                </label>
                            </div>
                        </div>
                        {bulkUploadResult && (
                            <div className="bulk-upload-result">
                                <p><strong>{bulkUploadResult.updated}</strong> product(s) updated.</p>
                                {bulkUploadResult.errors.length > 0 && (
                                    <p className="bulk-errors">Errors: {bulkUploadResult.errors.slice(0, 5).join("; ")}{bulkUploadResult.errors.length > 5 ? "…" : ""}</p>
                                )}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={closeBulkUploadModal}>Close</button>
                            <button type="button" className="confirm-btn" onClick={handleBulkUploadPrices} disabled={bulkUploading || !bulkFile}>
                                {bulkUploading ? "Uploading…" : "Upload & update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Apply Bulk Discount</h3>
                        <p>This will apply a discount to all products that currently have a price.</p>

                        <div className="modal-form">
                            <div className="form-group">
                                <label>Discount Type</label>
                                <select
                                    value={bulkType}
                                    onChange={(e) => setBulkType(e.target.value as "percentage" | "fixed")}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Value</label>
                                <div className="input-wrapper">
                                    <span>{bulkType === "percentage" ? "%" : "₹"}</span>
                                    <input
                                        type="number"
                                        value={bulkValue}
                                        onChange={(e) => setBulkValue(e.target.value)}
                                        placeholder="Enter amount"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowBulkModal(false)} disabled={isApplyingBulk}>
                                Cancel
                            </button>
                            <button className="confirm-btn" onClick={handleBulkUpdate} disabled={isApplyingBulk}>
                                {isApplyingBulk ? "Applying..." : "Apply Discount"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .prices-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
        .header-info h3 { font-size: 1.5rem; margin: 0 0 0.5rem 0; color: #1e293b; }
        .header-info p { color: #64748b; margin: 0; }
        .header-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .search-bar { position: relative; display: flex; align-items: center; }
        .search-bar i { position: absolute; left: 1rem; color: #94a3b8; }
        .search-bar input { padding: 0.75rem 1rem 0.75rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 12px; width: 250px; outline: none; transition: 0.3s; }
        .search-bar input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
        .bulk-upload-prices-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #0d9488; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .bulk-upload-prices-btn:hover { background: #0f766e; transform: translateY(-2px); }
        .bulk-update-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #6366f1; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .bulk-update-btn:hover { background: #4f46e5; }
        .bulk-upload-modal .bulk-upload-actions { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .template-download-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer; }
        .template-download-btn:hover { background: #f1f5f9; }
        .file-input { position: absolute; width: 0; height: 0; opacity: 0; }
        .file-label { display: block; padding: 0.75rem 1rem; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; text-align: center; font-size: 0.875rem; color: #64748b; cursor: pointer; }
        .file-label:hover { border-color: #0d9488; color: #0d9488; }
        .file-input-wrap { position: relative; }
        .bulk-upload-result { padding: 1rem; background: #f0fdf4; border-radius: 12px; margin-bottom: 1rem; font-size: 0.875rem; }
        .bulk-upload-result .bulk-errors { color: #b91c1c; margin-top: 0.5rem; font-size: 0.8125rem; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .no-results { grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f8fafc; border-radius: 16px; color: #64748b; font-size: 1.125rem; }

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
        @media (max-width: 480px) {
          .pagination { gap: 0.25rem; }
          .pager-btn { min-width: 34px; height: 34px; font-size: 0.8125rem; border-radius: 8px; }
        }
        @media (max-width: 768px) {
          .prices-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.25rem;
          }
          .header-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .search-bar input {
            width: 100%;
          }
          .bulk-upload-prices-btn, .bulk-update-btn {
            width: 100%;
            justify-content: center;
          }
          .pricing-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .pagination {
            flex-direction: column;
            gap: 1.25rem;
          }
        }
        @media (max-width: 480px) {
          .pricing-grid {
            gap: 0.5rem;
          }
        }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 2rem; border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-content h3 { margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1.25rem; }
        .modal-content p { color: #64748b; margin: 0 0 1.5rem 0; font-size: 0.875rem; }
        .modal-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.875rem; font-weight: 600; color: #334155; }
        .form-group select, .form-group input { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; outline: none; transition: 0.3s; width: 100%; }
        .form-group select:focus, .form-group input:focus { border-color: #6366f1; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper span { position: absolute; left: 1rem; color: #64748b; font-weight: 600; }
        .input-wrapper input { padding-left: 2rem; }
        .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
        .cancel-btn { padding: 0.75rem 1.5rem; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .cancel-btn:hover:not(:disabled) { background: #e2e8f0; }
        .confirm-btn { padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .confirm-btn:hover:not(:disabled) { background: #4f46e5; }
        .cancel-btn:disabled, .confirm-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
        </div>

    );
}

function PriceCard({ product, onUpdate, isLoading }: { product: Product, onUpdate: (id: string, price: string, wasPrice: string) => void, isLoading: boolean }) {
    const [price, setPrice] = useState(product.price || "");
    const [wasPrice, setWasPrice] = useState(product.wasPrice || "");

    const badgeLabel = product.sku ? `SKU: ${product.sku}` : `ID: ${product.id.slice(0, 8)}`;

    return (
        <div className="price-card">
            <div className="card-top">
                <h4>{product.title}</h4>
                <span className="margin-badge">{badgeLabel}</span>
            </div>
            <div className="price-inputs">
                <div className="input-field">
                    <label>Was Price (₹)</label>
                    <div className="input-wrapper">
                        <span>₹</span>
                        <input
                            type="text"
                            value={wasPrice}
                            onChange={(e) => setWasPrice(e.target.value)}
                        />
                    </div>
                </div>
                <div className="input-field">
                    <label>Now Price (₹)</label>
                    <div className="input-wrapper">
                        <span>₹</span>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <button
                    className="update-btn"
                    onClick={() => onUpdate(product.id, price, wasPrice)}
                    disabled={isLoading}
                >
                    {isLoading ? "Updating..." : "Update Price"}
                </button>
            </div>

            <style jsx>{`
                .price-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; transition: all 0.3s; }
                .price-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
                .card-top h4 { 
                    margin: 0; 
                    font-size: 1.125rem; 
                    color: #1e293b; 
                }
                .margin-badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.625rem; background: #f0f9ff; color: #0369a1; border-radius: 6px; flex-shrink: 0; }
                .price-inputs { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .input-field { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-field label { font-size: 0.8125rem; color: #64748b; font-weight: 500; }
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-wrapper span { position: absolute; left: 0.75rem; color: #94a3b8; }
                .input-wrapper input { width: 100%; padding: 0.625rem 0.75rem 0.625rem 1.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; color: #1e293b; }
                .update-btn { width: 100%; padding: 0.75rem; background: #ffc451; border: none; border-radius: 10px; color: #fff; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .update-btn:hover { background: #f8b42d; }
                .update-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .price-card { padding: 1rem; gap: 1rem; }
                    .card-top { flex-direction: column; align-items: flex-start; }
                    .card-top h4 { 
                        font-size: 0.9rem;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        height: 2.2rem;
                        line-height: 1.1;
                    }
                    .margin-badge { font-size: 0.65rem; padding: 2px 6px; }
                    .price-inputs { gap: 0.75rem; }
                    .input-field label { font-size: 0.75rem; }
                    .input-wrapper input { padding: 0.5rem 0.5rem 0.5rem 1.5rem; font-size: 0.875rem; }
                    .update-btn { padding: 0.625rem; font-size: 0.875rem; }
                }
            `}</style>
        </div>
    );
}
