"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import QRCode from "qrcode";

interface QrCodeData {
    id: string;
    name: string;
    url: string;
    scanCount: number;
    createdAt: string;
    shortCode: string;
}

export default function QrCodeClient() {
    const [qrCodes, setQrCodes] = useState<QrCodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", url: "" });
    const [selectedQrUrl, setSelectedQrUrl] = useState<string | null>(null);
    const [qrToDelete, setQrToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statsQrId, setStatsQrId] = useState<string | null>(null);
    const [scans, setScans] = useState<any[]>([]);
    const [loadingScans, setLoadingScans] = useState(false);
    const [originUrl] = useState(() => typeof window !== "undefined" ? window.location.origin : "");

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fetchQrCodes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/qr");
            if (!res.ok) throw new Error("Failed to fetch QR codes");
            const data = await res.json();
            setQrCodes(data.qrCodes);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQrCodes();
    }, []);

    useEffect(() => {
        if (selectedQrUrl && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, selectedQrUrl, { width: 250, margin: 2, errorCorrectionLevel: 'H' }, (error) => {
                if (error) {
                    console.error("Error generating QR code:", error);
                } else if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        const img = new Image();
                        img.crossOrigin = "anonymous"; // Important to prevent canvas tainting
                        img.src = '/favicon.png';
                        img.onload = () => {
                            const canvasSize = 250;
                            const imgSize = 60; // Size of the logo
                            const x = (canvasSize - imgSize) / 2;
                            const y = (canvasSize - imgSize) / 2;

                            // Draw a white background square with slightly rounded appearance or just a square
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(x - 4, y - 4, imgSize + 8, imgSize + 8);

                            // Draw the logo
                            ctx.drawImage(img, x, y, imgSize, imgSize);
                        };
                    }
                }
            });
        }
    }, [selectedQrUrl]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const res = await fetch("/api/admin/qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create QR code");

            toast.success("QR Code created successfully!");
            setFormData({ name: "", url: "" });
            fetchQrCodes();

            // Show the newly generated QR Code
            const trackingUrl = `${originUrl}/q/${data.qrCode.shortCode}`;
            setSelectedQrUrl(trackingUrl);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!qrToDelete) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/qr?id=${qrToDelete}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            toast.success("Deleted successfully");
            fetchQrCodes();
            if (selectedQrUrl?.endsWith(`/q/${qrToDelete}`)) {
                setSelectedQrUrl(null);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
            setQrToDelete(null);
        }
    };

    const fetchScans = async (id: string) => {
        setStatsQrId(id);
        setLoadingScans(true);
        setScans([]);
        try {
            const res = await fetch(`/api/admin/qr/scans?id=${id}`);
            if (!res.ok) throw new Error("Failed to fetch scans");
            const data = await res.json();
            setScans(data.scans || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingScans(false);
        }
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-code.png";
        a.click();
    };

    return (
        <div className="qr-codes-container">
            <div className="section-header">
                <div>
                    <h3>Manage QR Codes</h3>
                    <p>Generate short URLs and track scans with QR codes.</p>
                </div>
            </div>

            <div className="layout-grid">
                {/* Create Form */}
                <div className="form-card">
                    <h4 className="card-title">Create New QR Code</h4>
                    <form onSubmit={handleCreate} className="qr-form">
                        <div className="input-group">
                            <label>Name / Label</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Summer Campaign Banner"
                            />
                        </div>
                        <div className="input-group">
                            <label>Destination URL</label>
                            <input
                                type="url"
                                required
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="e.g. https://hallmarkworld.com/shop/offer"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            {isSubmitting ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                            ) : (
                                "Generate QR Code"
                            )}
                        </button>
                    </form>


                </div>

                {/* List Table */}
                <div className="table-card">
                    <h4 className="card-title">Existing QR Codes</h4>
                    {loading ? (
                        <div className="empty-state">Loading...</div>
                    ) : qrCodes.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-qr-code"></i>
                            <p>No QR codes generated yet.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Target URL</th>
                                        <th style={{ textAlign: 'center' }}>Scans</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qrCodes.map((qr) => (
                                        <tr key={qr.id}>
                                            <td><strong>{qr.name}</strong></td>
                                            <td className="truncate-text" title={qr.url}>
                                                {qr.url}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="scan-badge">
                                                    {qr.scanCount}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-flex">
                                                    <button
                                                        onClick={() => setSelectedQrUrl(`${originUrl}/q/${qr.shortCode}`)}
                                                        className="action-icon-btn view-btn"
                                                        title="View QR Code"
                                                    >
                                                        <i className="bi bi-qr-code"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => fetchScans(qr.id)}
                                                        className="action-icon-btn stats-btn"
                                                        title="View Scan Stats"
                                                    >
                                                        <i className="bi bi-bar-chart"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setQrToDelete(qr.id)}
                                                        className="action-icon-btn delete-icon-btn"
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Offcanvas for QR Preview */}
            {selectedQrUrl && (
                <>
                    <div className="offcanvas-backdrop" onClick={() => setSelectedQrUrl(null)}></div>
                    <div className="offcanvas-panel">
                        <div className="offcanvas-header">
                            <h4 className="card-title" style={{ marginBottom: 0 }}>QR Code Preview</h4>
                            <button className="close-btn" onClick={() => setSelectedQrUrl(null)}>
                                <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
                            </button>
                        </div>
                        <div className="offcanvas-body">
                            <div className="qr-canvas-wrapper">
                                <canvas ref={canvasRef}></canvas>
                            </div>
                            <p className="qr-url-text">
                                {selectedQrUrl}
                            </p>
                            <button onClick={handleDownload} className="download-btn" style={{ width: '100%', justifyContent: 'center' }}>
                                <i className="bi bi-download"></i>
                                Download PNG
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {qrToDelete && (
                <>
                    <div className="modal-backdrop" onClick={() => !isDeleting && setQrToDelete(null)}></div>
                    <div className="custom-modal">
                        <div className="modal-icon text-danger">
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h4 className="modal-title">Delete QR Code?</h4>
                        <p className="modal-text">
                            Are you sure you want to delete this QR code?
                            <br /><strong>Tracking will stop working</strong> for anyone who scans it in the future.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel-btn"
                                onClick={() => setQrToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm-btn"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Offcanvas for Stats */}
            {statsQrId && (
                <>
                    <div className="offcanvas-backdrop" onClick={() => setStatsQrId(null)}></div>
                    <div className="offcanvas-panel stats-panel">
                        <div className="offcanvas-header">
                            <h4 className="card-title" style={{ marginBottom: 0 }}>Scan Statistics</h4>
                            <button className="close-btn" onClick={() => setStatsQrId(null)}>
                                <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
                            </button>
                        </div>
                        <div className="offcanvas-body" style={{ textAlign: 'left' }}>
                            {loadingScans ? (
                                <div className="text-center py-5 text-muted">
                                    <span className="spinner-border spinner-border-sm me-2"></span>Loading scans...
                                </div>
                            ) : scans.length === 0 ? (
                                <div className="text-center py-5 text-muted" style={{ padding: '3rem' }}>
                                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block', color: '#cbd5e1' }}></i>
                                    No scans recorded yet.
                                </div>
                            ) : (
                                <div className="scans-list">
                                    {scans.map((scan) => (
                                        <div key={scan.id} className="scan-item">
                                            <div className="scan-header">
                                                <span className="scan-ip"><i className="bi bi-geo-alt me-1"></i>{scan.ip}</span>
                                                <span className="scan-time">{new Date(scan.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div className="scan-ua">
                                                <i className="bi bi-laptop me-1"></i>
                                                {scan.userAgent}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .qr-codes-container { width: 100%; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .section-header h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .section-header p { color: #64748b; margin: 0; }
                
                .layout-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
                
                @media (min-width: 992px) {
                    .layout-grid {
                        grid-template-columns: 350px 1fr;
                    }
                }

                .form-card, .table-card {
                    background: #fff;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    padding: 1.5rem;
                }

                .card-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .qr-form { display: flex; flex-direction: column; gap: 1.2rem; }
                
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-group label { font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.025em; }
                .input-group input { 
                    padding: 0.8rem 1rem; 
                    border-radius: 12px; 
                    border: 1px solid #e2e8f0; 
                    background: #f8fafc; 
                    font-size: 0.95rem; 
                    transition: all 0.2s; 
                }
                .input-group input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }

                .submit-btn {
                    background: #ffc451;
                    color: #fff;
                    border: none;
                    padding: 0.9rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 0.5rem;
                }
                .submit-btn:hover { background: #f8b42d; transform: translateY(-2px); }
                .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

                .offcanvas-backdrop {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 1040;
                }
                .offcanvas-panel {
                    position: fixed;
                    top: 0; right: 0; bottom: 0;
                    width: 380px;
                    max-width: 100vw;
                    background: #fff;
                    z-index: 1045;
                    box-shadow: -4px 0 24px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease-out forwards;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .offcanvas-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .close-btn {
                    background: #f8fafc;
                    border: none;
                    width: 32px; height: 32px;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #64748b; transition: 0.2s;
                }
                .close-btn:hover { background: #f1f5f9; color: #0f172a; }
                .offcanvas-body {
                    padding: 2rem 1.5rem;
                    text-align: center;
                    overflow-y: auto;
                    flex: 1;
                }

                .modal-backdrop {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 1050;
                    animation: fadeIn 0.2s ease-out;
                }
                .custom-modal {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #fff;
                    width: 90%; max-width: 400px;
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    z-index: 1055;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    text-align: center;
                    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { 
                    from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); } 
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
                }
                .modal-icon { font-size: 3.5rem; margin-bottom: 0.5rem; color: #ef4444; }
                .modal-title { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
                .modal-text { font-size: 0.95rem; color: #64748b; margin-bottom: 2rem; line-height: 1.5; }
                .modal-actions { display: flex; gap: 1rem; }
                .modal-btn { flex: 1; padding: 0.9rem; border-radius: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; font-size: 0.95rem; }
                .cancel-btn { background: #f1f5f9; color: #475569; }
                .cancel-btn:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
                .confirm-btn { background: #ef4444; color: #fff; }
                .confirm-btn:hover:not(:disabled) { background: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
                .modal-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .qr-canvas-wrapper {
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 16px;
                    display: inline-block;
                    margin-bottom: 1rem;
                }

                .qr-url-text {
                    font-size: 0.8rem;
                    color: #64748b;
                    word-break: break-all;
                    margin-bottom: 1rem;
                }

                .download-btn {
                    background: #f1f5f9;
                    color: #1e293b;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                .download-btn:hover { background: #e2e8f0; }

                .empty-state { padding: 3rem; text-align: center; color: #94a3b8; }
                .empty-state i { font-size: 2.5rem; margin-bottom: 1rem; display: block; color: #cbd5e1; }

                .table-responsive { overflow-x: auto; }
                .custom-table { width: 100%; border-collapse: collapse; text-align: left; }
                .custom-table th { 
                    padding: 1rem; 
                    border-bottom: 1px solid #e2e8f0; 
                    color: #64748b; 
                    font-weight: 600; 
                    font-size: 0.85rem; 
                    text-transform: uppercase; 
                }
                .custom-table td { 
                    padding: 1rem; 
                    border-bottom: 1px solid #f1f5f9; 
                    color: #334155; 
                    vertical-align: middle;
                }
                .truncate-text { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .scan-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .actions-flex { display: flex; gap: 0.5rem; }
                .action-icon-btn {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                    color: #64748b;
                }
                .view-btn:hover { background: #fff; color: #ffc451; border-color: #ffc451; }
                .stats-btn:hover { background: #f0fdf4; color: #16a34a; border-color: #16a34a; }
                .delete-icon-btn:hover { background: #fef2f2; color: #dc2626; border-color: #dc2626; }

                .stats-panel { width: 450px; }
                .scans-list { display: flex; flex-direction: column; gap: 1rem; }
                .scan-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
                .scan-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #0f172a; }
                .scan-time { color: #64748b; font-weight: 400; font-size: 0.8rem; }
                .scan-ua { font-size: 0.8rem; color: #475569; word-break: break-word; background: #fff; padding: 0.5rem; border-radius: 6px; border: 1px solid #f1f5f9; }
            `}</style>
        </div>
    );
}
