"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

interface OtpRecord {
  id: string;
  mobile: string;
  otp: string;
  source: "Checkout" | "Admin Login" | "Delivery";
  label: string | null;
  expiry: string;
  updatedAt: string;
}

const SOURCE_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  "Checkout":    { bg: "#dbeafe", color: "#1d4ed8", icon: "bi bi-cart-fill" },
  "Admin Login": { bg: "#fce7f3", color: "#be185d", icon: "bi bi-shield-lock-fill" },
  "Delivery":    { bg: "#d1fae5", color: "#065f46", icon: "bi bi-truck" },
};

function isExpired(expiry: string) {
  return new Date(expiry) < new Date();
}

function timeLeft(expiry: string) {
  const diff = new Date(expiry).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export default function OtpVerificationsClient() {
  const [otps, setOtps] = useState<OtpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Checkout" | "Admin Login" | "Delivery">("All");
  const [tick, setTick] = useState(0); // forces re-render every second for countdown

  const fetchOtps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/otp-verifications");
      if (res.ok) {
        const data = await res.json();
        setOtps(data.otps || []);
      }
    } catch (err) {
      console.error("Failed to fetch OTPs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOtps();
    const poll = setInterval(fetchOtps, 10000);
    return () => clearInterval(poll);
  }, [fetchOtps]);

  // Countdown tick every second
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDelete = async (record: OtpRecord) => {
    setDeleting(record.id);
    try {
      await fetch("/api/admin/otp-verifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, source: record.source }),
      });
      setOtps(prev => prev.filter(o => o.id !== record.id));
    } catch (err) {
      console.error("Failed to delete OTP", err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === "All" ? otps : otps.filter(o => o.source === filter);
  const counts = {
    All: otps.length,
    Checkout: otps.filter(o => o.source === "Checkout").length,
    "Admin Login": otps.filter(o => o.source === "Admin Login").length,
    Delivery: otps.filter(o => o.source === "Delivery").length,
  };

  return (
    <div className="otp-page">
      {/* Header row */}
      <div className="otp-topbar">
        <div className="otp-summary">
          <span className="otp-count-badge">{otps.length} Live OTP{otps.length !== 1 ? "s" : ""}</span>
          <span className="otp-refresh-hint">
            <i className="bi bi-arrow-clockwise"></i> auto-refreshes every 10s
          </span>
        </div>
        <button className="otp-refresh-btn" onClick={fetchOtps}>
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="otp-filters">
        {(["All", "Checkout", "Admin Login", "Delivery"] as const).map(f => (
          <button
            key={f}
            className={`otp-filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f !== "All" && <i className={`${SOURCE_STYLES[f].icon} tab-icon`}></i>}
            {f}
            <span className="tab-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="otp-loading">
          <div className="otp-spinner"></div>
          <p>Loading OTP records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="otp-empty">
          <i className="bi bi-shield-check"></i>
          <p>No active OTPs</p>
          <span>All OTPs have been verified or expired.</span>
        </div>
      ) : (
        <div className="otp-table-wrap">
          <table className="otp-table">
            <thead>
              <tr>
                <th>Mobile Number</th>
                <th>OTP</th>
                <th>Source</th>
                <th>Label</th>
                <th>Expires In</th>
                <th>Sent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => {
                const expired = isExpired(record.expiry);
                const style = SOURCE_STYLES[record.source];
                return (
                  <tr key={`${record.source}-${record.id}`} className={expired ? "row-expired" : ""}>
                    <td>
                      <div className="mobile-cell">
                        <i className="bi bi-phone"></i>
                        <span>{record.mobile}</span>
                      </div>
                    </td>
                    <td>
                      <span className="otp-code">{record.otp}</span>
                    </td>
                    <td>
                      <span
                        className="source-badge"
                        style={{ background: style.bg, color: style.color }}
                      >
                        <i className={style.icon}></i>
                        {record.source}
                      </span>
                    </td>
                    <td>
                      <span className="label-cell">{record.label || "—"}</span>
                    </td>
                    <td>
                      <span className={`expiry-cell ${expired ? "expired" : "active-expiry"}`}>
                        {expired
                          ? <><i className="bi bi-x-circle-fill"></i> Expired</>
                          : <><i className="bi bi-clock-fill"></i> {timeLeft(record.expiry)}</>
                        }
                      </span>
                    </td>
                    <td>
                      <span className="sent-time">
                        {formatDistanceToNow(new Date(record.updatedAt), { addSuffix: true })}
                      </span>
                    </td>
                    <td>
                      <button
                        className="clear-btn"
                        onClick={() => handleDelete(record)}
                        disabled={deleting === record.id}
                        title="Clear OTP"
                      >
                        {deleting === record.id
                          ? <i className="bi bi-arrow-repeat spin"></i>
                          : <><i className="bi bi-trash3"></i> Clear</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .otp-page {
          max-width: 100%;
        }

        .otp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .otp-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .otp-count-badge {
          background: #0f172a;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
        }

        .otp-refresh-hint {
          font-size: 0.75rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .otp-refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.45rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .otp-refresh-btn:hover {
          background: #e2e8f0;
        }

        /* Filter tabs */
        .otp-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .otp-filter-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .otp-filter-tab:hover {
          background: #f8fafc;
        }

        .otp-filter-tab.active {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .tab-icon {
          font-size: 0.8rem;
        }

        .tab-count {
          background: rgba(255,255,255,0.2);
          padding: 0.05rem 0.4rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 18px;
          text-align: center;
        }

        .otp-filter-tab:not(.active) .tab-count {
          background: #f1f5f9;
          color: #475569;
        }

        /* Loading */
        .otp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          gap: 1rem;
          color: #64748b;
        }

        .otp-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #f1f5f9;
          border-top-color: #ffc451;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty */
        .otp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          gap: 0.5rem;
        }

        .otp-empty i {
          font-size: 3rem;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .otp-empty p {
          margin: 0;
          font-weight: 700;
          font-size: 1.125rem;
          color: #1e293b;
        }

        .otp-empty span {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        /* Table */
        .otp-table-wrap {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          overflow-x: auto;
        }

        .otp-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }

        .otp-table thead tr {
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
        }

        .otp-table th {
          padding: 0.875rem 1.25rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .otp-table tbody tr {
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }

        .otp-table tbody tr:last-child {
          border-bottom: none;
        }

        .otp-table tbody tr:hover {
          background: #f8fafc;
        }

        .otp-table tbody tr.row-expired {
          opacity: 0.6;
        }

        .otp-table td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #1e293b;
          vertical-align: middle;
        }

        .mobile-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .mobile-cell i {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .otp-code {
          font-family: 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.15em;
          background: #f1f5f9;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
        }

        .source-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          white-space: nowrap;
        }

        .label-cell {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }

        .expiry-cell {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .expiry-cell.active-expiry {
          color: #16a34a;
        }

        .expiry-cell.expired {
          color: #dc2626;
        }

        .sent-time {
          font-size: 0.78rem;
          color: #94a3b8;
          white-space: nowrap;
        }

        .clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .clear-btn:hover:not(:disabled) {
          background: #dc2626;
          color: #fff;
          border-color: #dc2626;
        }

        .clear-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        @media (max-width: 768px) {
          .otp-topbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .otp-table th,
          .otp-table td {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
