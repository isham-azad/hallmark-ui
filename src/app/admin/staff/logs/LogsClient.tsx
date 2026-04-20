"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AuditLog, getAuditLogs } from "./actions";

export default function LogsClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const refreshLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(refreshLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Timestamp", "Admin Name", "Email", "Action", "Details"];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.name,
      log.email,
      log.action,
      JSON.stringify(log.details)
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(row => 
      row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="logs-container">
      <div className="section-header">
        <div className="header-content">
          <h2 className="section-title">Audit Logs</h2>
          <p className="section-desc">Track all administrative changes and actions across the system.</p>
        </div>
        <div className="header-actions">
          <button className="export-button" onClick={exportToCSV} title="Export to CSV">
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
          <button
            className="refresh-button"
            onClick={refreshLogs}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="controls-row">
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, action, or details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="logs-count">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      </div>

      <div className="card logs-card">
        <div className="logs-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-logs">
              <i className="bi bi-journal-text"></i>
              <p>{searchQuery ? 'No logs match your search.' : 'No activity logs found.'}</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-left">
                  <div className="log-avatar">
                    {log.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="log-info">
                    <div className="log-main">
                      <span className="log-user">{log.name}</span>
                      <span className="log-action">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="log-details-box">
                        {Object.entries(log.details).map(([key, val]) => (
                          <div key={key} className="detail-row">
                            <span className="detail-key">{key}:</span>
                            <span className="detail-val">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="log-meta">
                      <i className="bi bi-clock"></i>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="meta-sep">•</span>
                      <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .logs-container {
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .section-desc {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-wrapper i {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .logs-count {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }

        .refresh-button:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }

        .refresh-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .logs-list {
          display: flex;
          flex-direction: column;
        }

        .log-item {
          padding: 1.5rem;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.2s;
        }

        .log-item:last-child {
          border-bottom: none;
        }

        .log-item:hover {
          background: #fafafa;
        }

        .log-left {
          display: flex;
          gap: 1.25rem;
        }

        .log-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
          border: 2px solid #dbeafe;
        }

        .log-info {
          flex: 1;
        }

        .log-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .log-user {
          font-weight: 600;
          color: #1e293b;
        }

        .log-action {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.25rem 0.625rem;
          border-radius: 20px;
          background: #f1f5f9;
          color: #475569;
        }

        .log-details-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 0.75rem 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          background: white;
          padding: 0.35rem 0.625rem;
          border-radius: 6px;
          border: 1px solid #edf2f7;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .detail-key {
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-size: 0.65rem;
        }

        .detail-val {
          color: #0f172a;
          font-weight: 500;
          word-break: break-all;
        }

        .log-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .meta-sep {
          color: #cbd5e1;
        }

        .empty-logs {
          padding: 4rem 2rem;
          text-align: center;
          color: #94a3b8;
        }

        .empty-logs i {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .logs-container {
            padding: 1rem;
          }
          .section-header {
            flex-direction: column;
            gap: 1rem;
          }
          .refresh-button {
            width: 100%;
            justify-content: center;
          }
          .log-left {
            gap: 1rem;
          }
          .log-details-box {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
