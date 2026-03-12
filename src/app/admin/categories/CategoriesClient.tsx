"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, setCategoryStatus } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

interface Category {
  id: string;
  name: string;
  summary: string;
  image: string | null;
  status?: "active" | "disabled";
  _count?: {
    products: number;
  };
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const { showToast, ToastComponent } = useAdminToast();

  const filteredCategories = initialCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    setLoading(true);
    const result = await deleteCategory(id);
    setLoading(false);
    setIsDeleting(null);

    if (result.success) {
      showToast("Category deleted successfully");
      router.refresh();
    } else {
      showToast(result.error || "Failed to delete category", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    setTogglingStatusId(id);
    const result = await setCategoryStatus(id, nextStatus);
    setTogglingStatusId(null);
    if (result.success) {
      showToast(nextStatus === "disabled" ? "Category disabled" : "Category enabled");
      router.refresh();
    } else {
      showToast(result.error || "Failed to update status", "error");
    }
  };

  return (
    <div className="categories-container">
      {ToastComponent}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-icon warning">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>Are you sure?</h3>
            <p>This will delete the category permanently.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
              <button className="delete-btn" onClick={() => handleDelete(isDeleting)} disabled={loading}>
                {loading ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="categories-header">
        <div className="header-info">
          <h3>Category Management</h3>
          <p>Organize your products into logical groups for easier browsing.</p>
        </div>
        <button className="add-category-btn" onClick={() => router.push("/admin/categories/add")} style={{ textDecoration: "none" }}>
          <i className="bi bi-plus-lg"></i>
          Add New Category
        </button>
      </div>

      <div className="table-actions">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="categories-grid">
        {currentItems.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-img">
              {category.image ? (
                <img src={category.image} alt={category.name} />
              ) : (
                <div className="no-image">{category.name[0]}</div>
              )}
              <div className="category-overlay"></div>
            </div>
            <div className="category-body">
              <div className="category-title">
                <h4>{category.name}</h4>
                <span className="id-badge">#{category.id.slice(0, 8)}</span>
              </div>
              <span className={`category-status-pill ${(category.status ?? "active") === "active" ? "active" : "disabled"}`}>
                {(category.status ?? "active") === "active" ? "Active" : "Disabled"}
              </span>
              <p>{category.summary}</p>
              <div className="category-footer">
                <span className="count-pill">{category._count?.products || 0} Products</span>
                <button
                  type="button"
                  className="view-link"
                  onClick={() => router.push(`/admin/products?categoryId=${category.id}`)}
                >
                  View Products <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
            <div className="action-btns">
              <button
                className="action-btn"
                title="Edit"
                onClick={() => router.push(`/admin/categories/edit/${category.id}`)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className={`action-btn ${(category.status ?? "active") === "active" ? "disable" : "enable"}`}
                title={(category.status ?? "active") === "active" ? "Disable category" : "Enable category"}
                onClick={() => handleToggleStatus(category.id, (category.status ?? "active") as "active" | "disabled")}
                disabled={togglingStatusId === category.id}
              >
                <i className={`bi ${(category.status ?? "active") === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
              </button>
              <button className="action-btn delete" title="Delete" onClick={() => setIsDeleting(category.id)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pager-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="pager-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}

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
            animation: fadeIn 0.2s ease-out;
        }

        .confirm-modal {
            background: #fff;
            padding: 2.5rem;
            border-radius: 24px;
            width: 100%;
            max-width: 450px;
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
        .cancel-btn:hover { background: #f1f5f9; }
        .delete-btn { background: #ef4444; border: none; color: #fff; }
        .delete-btn:hover { background: #dc2626; transform: translateY(-2px); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .categories-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-info h3 {
          font-size: 1.5rem;
          margin: 0 0 0.25rem 0;
          color: #0f172a;
        }

        .header-info p {
          color: #64748b;
          margin: 0;
        }

        .add-category-btn {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 10px 24px !important;
          background: #ffc451 !important;
          color: #ffffff !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: all 0.3s !important;
          text-decoration: none !important;
          border: none !important;
          box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25) !important;
        }

        .add-category-btn:hover {
          background: #f8b42d !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 15px rgba(255, 196, 81, 0.35) !important;
        }

        .table-actions {
          margin-bottom: 2rem;
        }

        .search-box {
          position: relative;
          max-width: 400px;
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

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .category-img {
          position: relative;
          height: 180px;
          overflow: hidden;
          background: #f8fafc;
        }

        .category-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }

        .no-image {
          width: 100%;
          height: 100%;
          background: #ffc451;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 2rem;
        }

        .category-card:hover .category-img img {
          transform: scale(1.1);
        }

        .category-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .category-card:hover .category-overlay {
          opacity: 1;
        }

        .action-btns {
          display: flex;
          gap: 1rem;
          position: absolute;
          top: 90px;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          opacity: 0;
          transition: all 0.3s;
          pointer-events: none;
        }

        .category-card:hover .action-btns {
          opacity: 1;
          pointer-events: auto;
        }

        .action-btn {
          width: 44px;
          height: 44px;
          background: #fff;
          color: #0f172a;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          font-size: 1.125rem;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .action-btn:hover {
          background: #ffc451;
          color: #fff;
          transform: scale(1.1) translateY(-2px);
        }

        .action-btn.disable {
          background: #fff7ed;
          color: #ea580c;
        }

        .action-btn.enable {
          background: #f0fdf4;
          color: #16a34a;
        }

        .action-btn.disable:hover {
          background: #ea580c;
          color: #fff;
        }

        .action-btn.enable:hover {
          background: #16a34a;
          color: #fff;
        }

        .action-btn.delete:hover {
          background: #ef4444;
        }

        .category-status-pill {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .category-status-pill.active {
          background: #dcfce7;
          color: #166534;
        }

        .category-status-pill.disabled {
          background: #f1f5f9;
          color: #64748b;
        }

        .category-body {
          padding: 1.5rem;
        }

        .category-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .category-title h4 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }

        .id-badge {
          font-size: 0.75rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .category-body p {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          height: 42px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .category-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.25rem;
          border-top: 1px solid #f8fafc;
        }

        .count-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          padding: 0.375rem 0.875rem;
          border-radius: 20px;
        }

        .view-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d9488;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0;
        }

        .view-link:hover {
          color: #0f172a;
        }

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

        @media (max-width: 768px) {
          .categories-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .add-category-btn { width: 100%; justify-content: center; }
          .search-box { max-width: none; }
          
          .categories-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          
          .category-card { border-radius: 16px; }
          .category-img { height: 120px; }
          .no-image { font-size: 1.5rem; }
          
          .category-overlay { display: none; }
          
          .action-btns { 
            opacity: 1 !important;
            position: static !important;
            transform: none !important;
            pointer-events: auto !important;
            display: flex;
            justify-content: space-around;
            gap: 1rem;
            padding: 0.75rem;
            background: #fafbfc;
            border-top: 1px solid #f1f5f9;
            width: 100% !important;
          }

          .action-btn { 
            width: 36px; 
            height: 36px; 
            font-size: 0.9rem; 
            border-radius: 10px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .category-body { padding: 0.875rem; }
          .category-title { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
          .category-title h4 { 
            font-size: 0.9rem; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .id-badge { font-size: 0.65rem; padding: 1px 4px; }
          
          .category-body p {
            font-size: 0.75rem;
            height: auto;
            margin-bottom: 0.75rem;
            -webkit-line-clamp: 2;
          }
          
          .category-footer { flex-direction: column; align-items: flex-start; gap: 0.5rem; padding-top: 0.75rem; }
          .count-pill { font-size: 0.7rem; padding: 0.25rem 0.5rem; width: 100%; text-align: center; }
          .view-link { font-size: 0.75rem; width: 100%; justify-content: center; }
        }

        @media (max-width: 480px) {
          .categories-grid { gap: 0.5rem; }
          .category-body { padding: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
