"use client";

import { useState } from "react";
import { addAllowedPincode, removeAllowedPincode } from "@/app/admin/orders/actions";
import { useAdminToast } from "@/components/AdminToast";

interface AllowedPincodesClientProps {
    initialPincodes: string[];
}

export default function AllowedPincodesClient({ initialPincodes }: AllowedPincodesClientProps) {
    const [pincodes, setPincodes] = useState<string[]>(initialPincodes);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const { showToast, ToastComponent } = useAdminToast();

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = input.trim().replace(/\D/g, "");
        if (value.length !== 6) {
            showToast("Please enter a valid 6-digit pincode.", "error");
            return;
        }
        setLoading(true);
        const result = await addAllowedPincode(value);
        setLoading(false);
        setInput("");
        if (result.success) {
            setPincodes((prev) => [...prev, value].sort());
            showToast("Pincode added successfully.");
        } else {
            showToast(result.error || "Failed to add pincode.", "error");
        }
    };

    const handleRemove = async (pincode: string) => {
        setRemoving(pincode);
        const result = await removeAllowedPincode(pincode);
        setRemoving(null);
        if (result.success) {
            setPincodes((prev) => prev.filter((p) => p !== pincode));
            showToast("Pincode removed.");
        } else {
            showToast(result.error || "Failed to remove pincode.", "error");
        }
    };

    return (
        <div className="allowed-pincodes-container">
            {ToastComponent}

            <div className="pincode-page-header">
                <h3 className="pincode-page-title">Allowed Pincodes</h3>
                <p className="pincode-page-desc">Manage pincodes where delivery is available. Customers will see delivery availability at checkout based on these pincodes.</p>
            </div>

            <div className="table-card pincode-card">
                <div className="pincode-add-section">
                    <label className="pincode-add-label">
                        <i className="bi bi-geo-alt"></i>
                        Add delivery pincode
                    </label>
                    <p className="pincode-add-hint">Enter a 6-digit Indian pincode to mark that area as deliverable.</p>
                    <form onSubmit={handleAdd} className="pincode-add-form">
                        <div className="pincode-input-group">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="pincode-input"
                                placeholder="e.g. 679577"
                                maxLength={6}
                                value={input}
                                onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
                                aria-label="6-digit pincode"
                            />
                            <button
                                type="submit"
                                className="pincode-add-btn"
                                disabled={loading || input.replace(/\D/g, "").length !== 6}
                            >
                                {loading ? (
                                    <span className="pincode-add-btn-text"><i className="bi bi-arrow-repeat spin"></i> Adding…</span>
                                ) : (
                                    <span className="pincode-add-btn-text"><i className="bi bi-plus-lg"></i> Add</span>
                                )}
                            </button>
                        </div>
                        {input.replace(/\D/g, "").length > 0 && input.replace(/\D/g, "").length < 6 && (
                            <p className="pincode-input-feedback">Enter 6 digits ({input.replace(/\D/g, "").length}/6)</p>
                        )}
                    </form>
                </div>

                <div className="pincode-list-wrap">
                    <h4 className="pincode-list-title">
                        <i className="bi bi-list-check"></i>
                        Delivery allowed in these areas ({pincodes.length})
                    </h4>
                    {pincodes.length === 0 ? (
                        <div className="pincode-empty">
                            <i className="bi bi-inbox"></i>
                            <p>No pincodes added yet.</p>
                            <p className="pincode-empty-sub">Add pincodes above to define where you deliver.</p>
                        </div>
                    ) : (
                        <ul className="pincode-list">
                            {pincodes.map((p) => (
                                <li key={p} className="pincode-item">
                                    <span className="pincode-value">{p}</span>
                                    <button
                                        type="button"
                                        className="pincode-remove-btn"
                                        title="Remove this pincode"
                                        onClick={() => handleRemove(p)}
                                        disabled={removing === p}
                                    >
                                        {removing === p ? <i className="bi bi-arrow-repeat spin"></i> : <i className="bi bi-x-lg"></i>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <style jsx>{`
                .allowed-pincodes-container { width: 100%; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
                .pincode-page-header { margin: 0 0 1.5rem 0; padding: 0; }
                .pincode-page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0; }
                .pincode-page-desc { margin: 0; color: #64748b; font-size: 0.9375rem; line-height: 1.5; }
                .pincode-card { padding: 1.75rem 0rem; }
                .pincode-add-section {
                    background: linear-gradient(135deg, #fffbf5 0%, #fff8eb 100%);
                    border: 1px solid #ffecd9;
                    border-radius: 14px;
                    padding: 1.25rem 1.5rem;
                    margin-bottom: 1.75rem;
                }
                .pincode-add-label {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;
                }
                .pincode-add-label i { color: #f59e0b; font-size: 1.2rem; }
                .pincode-add-hint { color: #64748b; font-size: 0.875rem; margin: 0 0 1rem 0; }
                .pincode-add-form { margin: 0; }
                .pincode-input-group {
                    display: flex; gap: 0; max-width: 320px;
                    border-radius: 12px; overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                }
                .pincode-input {
                    flex: 1;
                    min-width: 0;
                    padding: 14px 18px;
                    border: 1px solid #e2e8f0;
                    border-right: none;
                    border-radius: 12px 0 0 12px;
                    font-size: 1.125rem;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.05em;
                }
                .pincode-input:focus { outline: none; border-color: #ffc451; }
                .pincode-add-btn {
                    display: inline-flex; align-items: center; justify-content: center;
                    padding: 0 1.5rem;
                    background: #ffc451;
                    color: #0f172a;
                    border: none;
                    border-radius: 0 12px 12px 0;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s;
                }
                .pincode-add-btn:hover:not(:disabled) {
                    background: #f8b42d;
                    transform: translateY(-1px);
                }
                .pincode-add-btn:active:not(:disabled) { transform: translateY(0); }
                .pincode-add-btn:disabled {
                    background: #cbd5e1;
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .pincode-add-btn-text { display: inline-flex; align-items: center; gap: 8px; }
                .pincode-add-btn .spin { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .pincode-input-feedback { font-size: 0.8125rem; color: #f59e0b; margin: 8px 0 0 0; }
                .pincode-list-wrap { padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
                .pincode-list-title {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 1rem; font-weight: 600; margin-bottom: 14px; color: #0f172a;
                }
                .pincode-list-title i { color: #64748b; }
                .pincode-empty {
                    text-align: center; padding: 2rem 1rem;
                    background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;
                }
                .pincode-empty i { font-size: 2.5rem; color: #cbd5e1; display: block; margin-bottom: 12px; }
                .pincode-empty p { margin: 0; color: #64748b; font-size: 0.9375rem; }
                .pincode-empty-sub { font-size: 0.8125rem; margin-top: 4px !important; color: #94a3b8; }
                .pincode-list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 10px; }
                .pincode-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 18px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                }
                .pincode-value { font-weight: 700; font-family: ui-monospace, monospace; font-size: 1.0625rem; letter-spacing: 0.04em; }
                .pincode-remove-btn {
                    width: 32px; height: 32px;
                    background: #fff;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex; align-items: center; justify-content: center;
                    font-size: 0.75rem;
                    transition: background 0.15s, color 0.15s, border-color 0.15s;
                }
                .pincode-remove-btn:hover:not(:disabled) {
                    background: #fee2e2; color: #dc2626; border-color: #fecaca;
                }
                .pincode-remove-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 768px) {
            .pincode-page-header { text-align: center; }
            .pincode-add-section { padding: 1rem; }
            .pincode-input-group { max-width: none; width: 100%; }
            .pincode-list { justify-content: center; }
            .pincode-item { width: 100%; justify-content: space-between; padding: 14px 20px; }
            .pincode-value { font-size: 1.125rem; }
        }
      `}</style>
        </div>
    );
}
