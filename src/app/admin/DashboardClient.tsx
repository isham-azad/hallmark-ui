"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface Product {
  id: string;
  title: string;
  createdAt: string;
  brand: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNo: string;
  customer: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface SystemStatus {
  database: string;
  color: string;
  bg: string;
  badge: string;
  icon: string;
}

interface DashboardClientProps {
  stats: Stats[];
  recentProducts: Product[];
  recentOrders?: Order[];
  initialSystemStatus?: SystemStatus;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: "#dcfce7", color: "#16a34a" },
  Pending: { bg: "#fef9c3", color: "#ca8a04" },
  Processing: { bg: "#dbeafe", color: "#2563eb" },
  Shipped: { bg: "#ede9fe", color: "#7c3aed" },
  Cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

export default function DashboardClient({
  stats: initialStats,
  recentProducts: initialProducts,
  recentOrders: initialOrders = [],
  initialSystemStatus,
}: DashboardClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats[]>(initialStats);
  const [recentProducts, setRecentProducts] = useState<Product[]>(initialProducts);
  const [recentOrders, setRecentOrders] = useState<Order[]>(initialOrders);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(
    initialSystemStatus || {
      database: "Checking...",
      color: "#eab308",
      bg: "#fef08a",
      badge: "#fef9c3",
      icon: "bi bi-database-exclamation",
    }
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentProducts(data.recentProducts);
          setRecentOrders(data.recentOrders || []);
          setSystemStatus(data.systemStatus);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (status: string) => {
    return STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#64748b" };
  };

  return (
    <div className="dashboard-container">
      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <i className={stat.icon}></i>
            </div>
            <div className="stat-info">
              <h3>{stat.label}</h3>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: Products + Orders */}
      <div className="dashboard-grid two-col">
        {/* Recently Added Products */}
        <div className="card">
          <div className="card-header">
            <h3>Recently Added Products</h3>
            <button className="view-all" onClick={() => router.push("/admin/products")}>
              View All <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          <div className="activity-list">
            {recentProducts.length > 0 ? (
              recentProducts.map((p) => (
                <div key={p.id} className="activity-item">
                  <div className="activity-indicator"></div>
                  <div className="activity-content">
                    <p className="product-title">{p.title}</p>
                    <div className="product-meta">
                      <span className="brand-tag">{p.brand.name}</span>
                      <span className="meta-dot">·</span>
                      <span className="meta-time">
                        {p.createdAt
                          ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No products found</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="view-all" onClick={() => router.push("/admin/orders")}>
              View All <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          <div className="activity-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((o) => {
                const s = getStatusStyle(o.status);
                return (
                  <div key={o.id} className="order-item">
                    <div className="order-left">
                      <p className="order-no">{o.orderNo}</p>
                      <p className="order-customer">{o.customer}</p>
                    </div>
                    <div className="order-right">
                      <span
                        className="status-badge"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {o.status}
                      </span>
                      <p className="order-total">{o.total}</p>
                      <p className="order-time">
                        {o.createdAt
                          ? formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No orders found</div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-row card">
        <div className="card-header">
          <h3>System Status</h3>
        </div>
        <div className="alerts-list">
          <div
            className="alert-item"
            style={{
              background: systemStatus.badge,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "12px",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                background: systemStatus.bg,
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
            >
              <i className={systemStatus.icon} style={{ color: systemStatus.color, fontSize: "1.25rem" }}></i>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>
                Database Connection
              </p>
              <span style={{ color: systemStatus.color, fontSize: "0.75rem", fontWeight: 500, transition: "all 0.3s ease" }}>
                {systemStatus.database}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          background: #fff;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid #f1f5f9;
          transition: box-shadow 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .stat-info h3 {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 0.25rem;
        }

        .stat-info p {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .system-row {
          margin-bottom: 2rem;
        }

        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }

        .card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .view-all {
          color: #38bdf8;
          background: transparent;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s;
          padding: 0;
        }

        .view-all:hover {
          color: #0ea5e9;
        }

        .activity-list {
          padding: 0.5rem 0;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.875rem 1.5rem;
          border-bottom: 1px solid #f8fafc;
          align-items: flex-start;
          transition: background 0.15s;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-item:hover {
          background: #f8fafc;
        }

        .activity-indicator {
          width: 8px;
          height: 8px;
          background: #38bdf8;
          border-radius: 50%;
          margin-top: 0.45rem;
          flex-shrink: 0;
        }

        .activity-content p {
          margin: 0 0 0.2rem;
          font-size: 0.875rem;
          color: #1e293b;
          line-height: 1.4;
        }

        .activity-content span {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .product-title {
          margin: 0 0 0.3rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
        }

        .product-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .brand-tag {
          display: inline-flex;
          align-items: center;
          font-size: 0.7rem;
          background: #e0f2fe;
          color: #0369a1;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          font-weight: 600;
          white-space: nowrap;
        }

        .meta-dot {
          color: #cbd5e1;
          font-size: 0.75rem;
        }

        .meta-time {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        /* Order items */
        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.875rem 1.5rem;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-item:hover {
          background: #f8fafc;
        }

        .order-left {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .order-no {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .order-customer {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
        }

        .order-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
        }

        .status-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.15rem 0.6rem;
          border-radius: 20px;
          white-space: nowrap;
        }

        .order-total {
          margin: 0;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .order-time {
          margin: 0;
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .alerts-list {
          padding: 1rem;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        @media (max-width: 1024px) {
          .two-col {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .stat-card {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .stat-icon {
            width: 40px;
            height: 40px;
            font-size: 1.25rem;
          }
          .stat-info h3 {
            font-size: 0.75rem;
          }
          .stat-info p {
            font-size: 1.125rem;
          }
          .dashboard-container {
            padding-bottom: 2rem;
          }
          .activity-item,
          .order-item {
            padding: 0.75rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            gap: 0.5rem;
          }
          .stat-card {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
