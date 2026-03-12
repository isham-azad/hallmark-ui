"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteBrand, setBrandStatus } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

interface Brand {
  id: string;
  name: string;
  summary: string;
  image: string | null;
  status?: "active" | "disabled";
  _count?: {
    products: number;
  };
}

interface BrandsClientProps {
  initialBrands: Brand[];
}

export default function BrandsClient({ initialBrands }: BrandsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const router = useRouter();

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

  const filteredBrands = initialBrands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredBrands.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteBrand(id);
    setIsDeleting(null);

    if (result.success) {
      showToast("Brand deleted successfully");
      router.refresh();
    } else {
      showToast(result.error || "Failed to delete brand", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    setTogglingStatusId(id);
    const result = await setBrandStatus(id, nextStatus);
    setTogglingStatusId(null);
    if (result.success) {
      showToast(nextStatus === "disabled" ? "Brand disabled" : "Brand enabled");
      router.refresh();
    } else {
      showToast(result.error || "Failed to update status", "error");
    }
  };

  return (
    <div className="brands-container">
      {ToastComponent}

      {isDeleting && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="modal-icon warning">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>Are you sure?</h3>
            <p>This action cannot be undone. You are about to delete this brand.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsDeleting(null)}>Cancel</button>
              <button className="delete-btn" onClick={() => handleDelete(isDeleting)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="brands-header">
        <div className="header-info">
          <h3>Brand Management</h3>
          <p>Manage your product brands, logos, and descriptions.</p>
        </div>
        <button className="add-brand-btn" onClick={() => router.push("/admin/brands/add")} style={{ textDecoration: 'none' }}>
          <i className="bi bi-plus-lg"></i>
          Add New Brand
        </button>
      </div>

      <div className="table-actions">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      <div className="brands-grid">
        {currentItems.map((brand) => (
          <div key={brand.id} className="brand-card">
            <div className="brand-card-header">
              <div className="brand-logo">
                {brand.image ? (
                  <img src={brand.image} alt={brand.name} />
                ) : (
                  <div className="no-image">{brand.name[0]}</div>
                )}
              </div>
              <div className="brand-actions">
                <button
                  className="icon-btn"
                  title="Edit"
                  onClick={() => router.push(`/admin/brands/edit/${brand.id}`)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className={`icon-btn ${(brand.status ?? "active") === "active" ? "disable" : "enable"}`}
                  title={(brand.status ?? "active") === "active" ? "Disable brand" : "Enable brand"}
                  onClick={() => handleToggleStatus(brand.id, (brand.status ?? "active") as "active" | "disabled")}
                  disabled={togglingStatusId === brand.id}
                >
                  <i className={`bi ${(brand.status ?? "active") === "active" ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                </button>
                <button
                  className="icon-btn delete"
                  title="Delete"
                  onClick={() => setIsDeleting(brand.id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div className="brand-body">
              <h4>{brand.name}</h4>
              <span className={`brand-status-pill ${(brand.status ?? "active") === "active" ? "active" : "disabled"}`}>
                {(brand.status ?? "active") === "active" ? "Active" : "Disabled"}
              </span>
              <p>{brand.summary}</p>
              <div className="brand-footer">
                <span className="count-pill">{brand._count?.products || 0} Products</span>
                <button
                  type="button"
                  className="view-link"
                  onClick={() => router.push(`/admin/products?brandId=${brand.id}`)}
                >
                  View Products <i className="bi bi-arrow-right"></i>
                </button>
              </div>
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
            animation: fadeIn 0.2s ease-out;
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

        .confirm-modal h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #0f172a; }
        .confirm-modal p { color: #64748b; margin-bottom: 2rem; line-height: 1.5; }

        .modal-actions { display: flex; gap: 1rem; }
        .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }

        .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
        .cancel-btn:hover { background: #f1f5f9; }

        .delete-btn { background: #ef4444; border: none; color: #fff; }
        .delete-btn:hover { background: #dc2626; transform: translateY(-2px); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .brands-header {
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

        .add-brand-btn {
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
          line-height: 1 !important;
          font-size: 0.95rem !important;
          box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25) !important;
        }

        .add-brand-btn:hover {
          background: #f8b42d !important;
          color: #ffffff !important;
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

        .brands-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .brand-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .brand-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .brand-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .brand-logo {
          width: 60px;
          height: 60px;
          background: #f8fafc;
          border-radius: 12px;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .brand-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
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
          font-size: 1.5rem;
        }

        .brand-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #38bdf8;
          color: #fff;
          border-color: #38bdf8;
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

        .icon-btn.disable:hover {
          background: #ea580c;
          color: #fff;
          border-color: #ea580c;
        }

        .icon-btn.enable:hover {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }

        .icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .brand-status-pill {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .brand-status-pill.active {
          background: #dcfce7;
          color: #166534;
        }

        .brand-status-pill.disabled {
          background: #f1f5f9;
          color: #64748b;
        }

        .brand-body h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
          color: #0f172a;
        }

        .brand-body p {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .brand-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
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
          .brands-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .add-brand-btn { width: 100%; justify-content: center; }
          .search-box { max-width: none; }
          
          .brands-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          
          .brand-card {
            padding: 0.875rem;
            border-radius: 16px;
          }
          
          .brand-card-header {
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          
          .brand-logo { width: 44px; height: 44px; padding: 0.25rem; }
          .brand-actions { gap: 0.35rem; }
          .icon-btn { width: 28px; height: 28px; font-size: 0.8rem; }
          
          .brand-body { text-align: center; }
          .brand-body h4 {
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .brand-body p {
            font-size: 0.75rem;
            -webkit-line-clamp: 2;
            margin-bottom: 0.75rem;
          }
          
          .brand-footer {
            flex-direction: column;
            padding-top: 0.75rem;
            gap: 0.5rem;
          }
          .count-pill { font-size: 0.7rem; padding: 0.25rem 0.5rem; width: 100%; text-align: center; }
          .view-link { font-size: 0.75rem; justify-content: center; width: 100%; }
        }

        @media (max-width: 480px) {
          .brands-grid { gap: 0.5rem; }
          .brand-card { padding: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
