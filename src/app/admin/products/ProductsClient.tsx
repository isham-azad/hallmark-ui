"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, setProductStatus } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

const PAGE_SIZE = 10;

interface Product {
  id: string;
  title: string;
  sku?: string | null;
  status?: "active" | "disabled";
  brandId?: string;
  categoryId?: string;
  category: {
    name: string;
  };
  price: string | null;
  image: string | null;
}

interface ProductsClientProps {
  initialProducts: Product[];
  initialBrandId?: string;
  initialCategoryId?: string;
}

export default function ProductsClient({
  initialProducts,
  initialBrandId,
  initialCategoryId,
}: ProductsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useAdminToast();

  const hasFilter = Boolean(initialBrandId || initialCategoryId);

  const filteredProducts = initialProducts.filter(p => {
    if (initialBrandId && p.brandId !== initialBrandId) return false;
    if (initialCategoryId && p.categoryId !== initialCategoryId) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.category.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, initialBrandId, initialCategoryId]);

  const clearFilter = () => {
    router.push("/admin/products");
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const result = await deleteProduct(id);
    setLoading(false);
    setIsDeleting(null);

    if (result.success) {
      showToast("Product deleted successfully");
      router.refresh();
    } else {
      showToast(result.error || "Failed to delete product", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    setTogglingStatusId(id);
    const result = await setProductStatus(id, nextStatus);
    setTogglingStatusId(null);
    if (result.success) {
      showToast(nextStatus === "disabled" ? "Product disabled" : "Product enabled");
      router.refresh();
    } else {
      showToast(result.error || "Failed to update status", "error");
    }
  };

  return (
    <div className="products-list-container">
      {ToastComponent}

      {isDeleting && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-icon warning">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>Are you sure?</h3>
            <p>This will permanently remove this product from your inventory.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
              <button className="delete-btn" onClick={() => handleDelete(isDeleting)} disabled={loading}>
                {loading ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="products-list-header">
        <div className="header-info">
          <h3>Products List</h3>
          <p>Manage your collection of products.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Filter products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="add-product-btn"
            onClick={() => router.push("/admin/products/add")}
          >
            <i className="bi bi-plus-lg"></i>
            Add New Product
          </button>
        </div>
      </div>

      {hasFilter && (
        <div className="filter-chip-wrap">
          <span className="filter-chip">
            {initialBrandId && "Brand"}
            {initialBrandId && initialCategoryId && " + "}
            {initialCategoryId && "Category"}
            {" filter active"}
          </span>
          <button type="button" className="clear-filter-btn" onClick={clearFilter}>
            <i className="bi bi-x-lg"></i> Clear filter
          </button>
        </div>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table className="products-table">
            <thead>
              <tr>
                <th className="th-no hide-mobile">#</th>
                <th>Product</th>
                <th className="hide-mobile">Category</th>
                <th>Price</th>
                <th className="hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p, index) => (
                <tr key={p.id}>
                  <td className="td-no hide-mobile">{startIndex + index + 1}</td>
                  <td>
                    <div className="product-info-cell">
                      <div className="product-img">
                        {p.image ? (
                          <img src={p.image.split(',')[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div className="no-img-text">{p.title[0]}</div>
                        )}
                      </div>
                      <div className="product-details">
                        <p className="p-name">{p.title}</p>
                        <p className="p-id">{p.sku ? `SKU: ${p.sku}` : `ID: #${p.id.slice(0, 8)}`}</p>
                        <div className="mobile-only mobile-category">{p.category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile" data-label="Category">{p.category.name}</td>
                  <td data-label="Price" className="price-cell"><strong>{p.price || "₹0.00"}</strong></td>
                  <td className="hide-mobile" data-label="Status">
                    <span className={`status-pill ${(p.status ?? "active") === "active" ? "active" : "disabled"}`}>
                      {(p.status ?? "active") === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="action-btns">
                      <button
                        type="button"
                        className="icon-btn edit"
                        title="Edit Product"
                        onClick={() => router.push(`/admin/products/edit/${p.id}`)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        type="button"
                        className={`icon-btn ${(p.status ?? "active") === "active" ? "disable" : "enable"}`}
                        title={(p.status ?? "active") === "active" ? "Disable Product" : "Enable Product"}
                        onClick={() => handleToggleStatus(p.id, (p.status ?? "active") as "active" | "disabled")}
                        disabled={togglingStatusId === p.id}
                      >
                        <i className={`bi ${(p.status ?? "active") === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                      </button>
                      <button
                        type="button"
                        className="icon-btn delete"
                        title="Delete Product"
                        onClick={() => setIsDeleting(p.id)}
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="pager-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              aria-label="Previous page"
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
              aria-label="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
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

        .confirm-modal {
            background: #fff;
            padding: 2.5rem;
            border-radius: 24px;
            width: 100%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .modal-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin: 0 auto 1.5rem;
        }
        .modal-icon.warning { background: #fff7ed; color: #f97316; }

        .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
        .delete-btn { background: #ef4444; border: none; color: #fff; }

        .products-list-container {
          padding: 0;
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
        .products-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }
        .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
        .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .filter-chip-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .filter-chip {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d9488;
          background: rgba(13, 148, 136, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }
        .clear-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
        }
        .clear-filter-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .search-bar {
          position: relative;
          width: 300px;
        }

        .search-bar i {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-bar input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
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
        }

        .add-product-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 10px 24px;
          background: #ffc451;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          line-height: 1;
          font-size: 0.95rem;
          box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25);
        }

        .add-product-btn:hover {
          background: #f8b42d;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 196, 81, 0.35);
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
        }

        .products-table th {
          text-align: left;
          padding: 1rem;
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .products-table th.th-no { width: 56px; text-align: center; }
        .products-table td.td-no { text-align: center; font-weight: 600; color: #64748b; font-size: 0.875rem; }

        .products-table td {
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

        .status-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-pill.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-pill.disabled {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-pill.draft {
          background: #f1f5f9;
          color: #475569;
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
          background: #fff;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .icon-btn.edit {
          background: #f0f9ff;
          color: #0369a1;
          border-color: #f0f9ff;
        }

        .icon-btn.disable {
          background: #fff7ed;
          color: #ea580c;
          border-color: #fff7ed;
        }

        .icon-btn.enable {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #f0fdf4;
        }

        .icon-btn.delete {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fef2f2;
        }

        .icon-btn:hover {
          background: #ffc451;
          color: #fff;
          border-color: #ffc451;
          transform: translateY(-2px);
        }        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
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
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2);
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

        @media (max-width: 768px) {
            .products-list-header {
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
            .search-bar { width: 100%; order: 2; }
            .add-product-btn { width: 100%; justify-content: center; order: 1; padding: 14px; }
            
            .table-card { background: transparent; border: none; box-shadow: none; }
            .products-table, .products-table tbody, .products-table tr, .products-table td {
                display: block;
                width: 100%;
            }
            .products-table thead, .hide-mobile { display: none !important; }
            
            .products-table tbody {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
            }
            
            .products-table tr {
                background: #fff;
                border-radius: 16px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                border: 1px solid #f1f5f9;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .products-table td {
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
            .mobile-category { font-size: 0.75rem; color: #0d9488; font-weight: 600; margin-top: 2px; }
            
            .price-cell { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem !important; }
            
            .action-btns {
                justify-content: center;
                gap: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid #f1f5f9;
            }
            .icon-btn { width: 32px; height: 32px; font-size: 0.9rem; border-radius: 8px; }
            
            .pagination {
                flex-direction: column;
                text-align: center;
                gap: 1.25rem;
                background: #fff;
                margin-top: 1.5rem;
                border-radius: 16px;
                padding: 1.5rem;
            }
        }
        
        @media (max-width: 480px) {
            .products-table tbody { gap: 0.5rem; }
            .products-table tr { padding: 0.75rem; }
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
