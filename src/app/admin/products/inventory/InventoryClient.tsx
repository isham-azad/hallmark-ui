"use client";

import { useState, useEffect } from "react";
import { updateProductStock } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

interface Product {
  id: string;
  title: string;
  image: string | null;
  sku: string | null;
  stock: number;
}

interface InventoryItem extends Product {
  status: string;
}

interface InventoryClientProps {
  products: Product[];
}

const BULK_CSV_TEMPLATE = "sku,stock\nHM-001,100\nHM-002,50\nHM-003,0";

export default function InventoryClient({ products }: InventoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const { showToast, ToastComponent } = useAdminToast();

  const filteredItems: InventoryItem[] = products
    .filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .map(p => ({
      ...p,
      status: p.stock === 0 ? "Out of Stock" : p.stock < 10 ? "Low Stock" : "In Stock"
    }));

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setSku(product.sku || "");
    setStock(product.stock.toString());
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    const result = await updateProductStock(selectedProduct.id, sku, parseInt(stock) || 0);
    setLoading(false);
    if (result.success) {
      showToast("Inventory updated successfully");
      setSelectedProduct(null);
    } else {
      showToast(result.error || "Failed to update inventory", "error");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([BULK_CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-upload-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      showToast("Please select a CSV file", "error");
      return;
    }
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const form = new FormData();
      form.set("file", bulkFile);
      const res = await fetch("/api/admin/inventory/bulk", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setBulkResult({ updated: data.updated, errors: data.errors || [] });
        showToast(`Bulk update: ${data.updated} product(s) updated`);
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

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setBulkFile(null);
    setBulkResult(null);
  };

  return (
    <div className="inventory-container">
      {ToastComponent}

      {bulkModalOpen && (
        <div className="modal-overlay" onClick={closeBulkModal}>
          <div className="bulk-modal" onClick={e => e.stopPropagation()}>
            <h3>Bulk upload inventory</h3>
            <p className="bulk-hint">Upload a CSV with columns <strong>sku</strong> and <strong>stock</strong>. Products are matched by SKU.</p>
            <div className="bulk-actions">
              <button type="button" className="template-btn" onClick={downloadTemplate}>
                <i className="bi bi-download"></i> Download template
              </button>
              <div className="file-input-wrap">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setBulkFile(e.target.files?.[0] ?? null);
                    setBulkResult(null);
                  }}
                  id="bulk-csv"
                  className="file-input"
                />
                <label htmlFor="bulk-csv" className="file-label">
                  {bulkFile ? bulkFile.name : "Choose CSV file"}
                </label>
              </div>
            </div>
            {bulkResult && (
              <div className="bulk-result">
                <p><strong>{bulkResult.updated}</strong> product(s) updated.</p>
                {bulkResult.errors.length > 0 && (
                  <p className="bulk-errors">Errors: {bulkResult.errors.slice(0, 5).join("; ")}{bulkResult.errors.length > 5 ? "…" : ""}</p>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={closeBulkModal}>Close</button>
              <button type="button" className="save-btn" onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile}>
                {bulkUploading ? "Uploading…" : "Upload & update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <h3>Update Inventory</h3>
            <p>Product: <strong>{selectedProduct.title}</strong></p>
            <div className="input-group">
              <label>SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. HM-1001"
              />
            </div>
            <div className="input-group">
              <label>Stock Level</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setSelectedProduct(null)}>Cancel</button>
              <button className="save-btn" onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="inventory-header">
        <div className="header-info">
          <h3>Inventory Management</h3>
          <p>Track and update product stock levels.</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="bulk-upload-btn"
            onClick={() => setBulkModalOpen(true)}
          >
            <i className="bi bi-upload"></i>
            Bulk upload inventory
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="th-no hide-mobile">#</th>
                <th>Product</th>
                <th className="hide-mobile">SKU</th>
                <th>Stock</th>
                <th className="hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="td-no hide-mobile">{startIndex + index + 1}</td>
                  <td>
                    <div className="product-info-cell">
                      <div className="product-img">
                        {item.image ? (
                          <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div className="no-img-text">{item.title[0]}</div>
                        )}
                      </div>
                      <div className="product-details">
                        <p className="p-name">{item.title}</p>
                        <p className="p-id">ID: #{item.id.slice(0, 8)}</p>
                        <div className="mobile-only mobile-sku">SKU: {item.sku || "N/A"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile"><code className="sku-tag">{item.sku || "N/A"}</code></td>
                  <td className="stock-cell">
                    <strong>{item.stock} units</strong>
                    <div className="mobile-only">
                      <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, "-")}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="hide-mobile">
                    <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        type="button"
                        className="icon-btn edit-stock"
                        title="Update Stock"
                        onClick={() => handleOpenModal(item)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-wrap">
            <p className="pagination-info">
              Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
            </p>
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <span className="pagination-pages">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

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
            padding: 20px;
        }

        .inventory-modal {
            background: #fff;
            padding: 2rem;
            border-radius: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .inventory-modal h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #0f172a; }
        .inventory-modal p { color: #64748b; margin-bottom: 1.5rem; }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .input-group label { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
        .input-group input { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.9375rem; }
        .input-group input:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); background: #fff; }

        .modal-actions { display: flex; gap: 1rem; }
        .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
        .cancel-btn:hover { background: #f1f5f9; }
        .save-btn { background: #ffc451; border: none; color: #fff; }
        .save-btn:hover { background: #f8b42d; transform: translateY(-2px); }

        .inventory-container {
          padding: 0;
        }

        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
        .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bulk-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #0d9488;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: 0.2s;
        }
        .bulk-upload-btn:hover {
          background: #0f766e;
          transform: translateY(-2px);
        }

        .bulk-modal {
          background: #fff;
          padding: 2rem;
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .bulk-modal h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #0f172a; }
        .bulk-hint { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5; }
        .bulk-actions { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .template-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; font-size: 0.875rem; font-weight: 600; color: #475569;
          cursor: pointer; transition: 0.2s;
        }
        .template-btn:hover { background: #f1f5f9; }
        .file-input { position: absolute; width: 0; height: 0; opacity: 0; }
        .file-label {
          display: block; padding: 0.75rem 1rem; background: #f8fafc; border: 2px dashed #e2e8f0;
          border-radius: 12px; text-align: center; font-size: 0.875rem; color: #64748b;
          cursor: pointer; transition: 0.2s;
        }
        .file-label:hover { border-color: #0d9488; color: #0d9488; }
        .file-input-wrap { position: relative; }
        .bulk-result { padding: 1rem; background: #f0fdf4; border-radius: 12px; margin-bottom: 1rem; font-size: 0.875rem; }
        .bulk-errors { color: #b91c1c; margin-top: 0.5rem; font-size: 0.8125rem; }

        .search-box {
          position: relative;
          width: 300px;
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

        .search-box input:focus {
          outline: none;
          border-color: #ffc451;
          box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
        }

        .table-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .inventory-table th {
          text-align: left;
          padding: 1rem;
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .inventory-table th.th-no {
          width: 56px;
          text-align: center;
        }

        .inventory-table td.td-no {
          text-align: center;
          font-weight: 600;
          color: #64748b;
          font-size: 0.875rem;
        }

        .inventory-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .product-info-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-img {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
        }

        .no-img-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffc451;
          color: #fff;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .p-name {
          margin: 0;
          font-weight: 600;
          color: #1e293b;
        }

        .p-id {
          margin: 0;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .sku-tag {
          background: #f1f5f9;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: #475569;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.in-stock {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.low-stock {
          background: #fef9c3;
          color: #854d0e;
        }

        .status-badge.out-of-stock {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-btns {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .icon-btn.edit-stock {
          background: #f0f9ff;
          color: #0369a1;
          border-color: #f0f9ff;
        }

        .icon-btn.edit-stock:hover {
          background: #38bdf8;
          color: #fff;
          border-color: #38bdf8;
          transform: translateY(-2px);
        }

        .pagination-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .pagination-info {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pagination-pages {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        .pagination-btn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          cursor: pointer;
          transition: 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #ffc451;
          color: #ffc451;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
            .inventory-header {
                flex-direction: column;
                align-items: stretch;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .header-info { text-align: left; }
            .header-actions {
                flex-direction: column;
                align-items: stretch;
                gap: 1rem;
            }
            .search-box { width: 100%; order: 2; }
            .bulk-upload-btn { width: 100%; justify-content: center; order: 1; padding: 12px; }
            
            .table-card { background: transparent; border: none; box-shadow: none; }
            .inventory-table, .inventory-table tbody, .inventory-table tr, .inventory-table td {
                display: block;
                width: 100%;
            }
            .inventory-table thead, .hide-mobile { display: none !important; }
            
            .inventory-table tbody {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
            }
            
            .inventory-table tr {
                background: #fff;
                border-radius: 16px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                border: 1px solid #f1f5f9;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .inventory-table td {
                padding: 0 !important;
                border: none !important;
            }
            
            .product-info-cell {
                flex-direction: column;
                text-align: center;
                gap: 0.75rem;
            }
            
            .product-img { width: 100%; height: 100px; }
            .p-name { 
              font-size: 0.9rem;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              height: 2.4rem;
              line-height: 1.2;
            }
            .mobile-sku { font-size: 0.7rem; color: #64748b; font-family: monospace; }
            
            .stock-cell { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem !important; }
            .stock-cell strong { font-size: 0.9rem; display: block; margin-bottom: 0.25rem; }
            
            .action-btns {
                justify-content: center;
                gap: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid #f1f5f9;
            }
            .icon-btn { width: 100%; height: 36px; border-radius: 8px; }

            .pagination-wrap { 
              flex-direction: column; 
              text-align: center; 
              gap: 1.25rem; 
              background: #fff;
              border-radius: 16px;
              padding: 1.5rem;
              margin-top: 1.5rem;
            }
            .inventory-modal, .bulk-modal { padding: 1.5rem; }
            .bulk-actions { gap: 0.75rem; }
            .template-btn { justify-content: center; }
        }
        
        @media (max-width: 480px) {
            .inventory-table tbody { gap: 0.5rem; }
            .inventory-table tr { padding: 0.75rem; }
            .product-img { height: 80px; }
            .p-name { font-size: 0.85rem; height: 2.2rem; }
        }

        .mobile-only { display: none; }
        @media (max-width: 768px) {
            .mobile-only { display: block; }
        }
      `}</style>
    </div>
  );
}
