"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPaymentMethod } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

export default function PaymentMethodAddClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [formData, setFormData] = useState({
        name: "",
        summary: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await createPaymentMethod({
            id: formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-"),
            name: formData.name,
            summary: formData.summary,
        });
        setLoading(false);

        if (result.success) {
            showToast("Payment method added successfully!");
            setTimeout(() => router.push("/admin/staff/payment-methods"), 1000);
        } else {
            showToast(result.error || "Failed to add payment method", "error");
        }
    };

    return (
        <div className="add-pm-container">
            {ToastComponent}
            <div className="header-actions mb-4">
                <Link href="/admin/staff/payment-methods" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Payment Methods
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="pm-form">
                <div className="form-section main-info">
                    <h3>Payment Method Information</h3>
                    <div className="input-group">
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Credit Card, UPI, Cash on Delivery"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Summary</label>
                        <textarea
                            placeholder="Brief description (e.g. Pay with Visa, Mastercard, Rupay...)"
                            rows={4}
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => router.push("/admin/staff/payment-methods")} className="cancel-btn">
                        Discard
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Saving..." : "Save Payment Method"}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .add-pm-container { max-width: 1000px; }
                .back-link {
                    display: flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none;
                    font-weight: 600; font-size: 0.9rem; transition: 0.2s;
                }
                .back-link:hover { color: #ffc451; }
                .pm-form { display: flex; flex-direction: column; gap: 2rem; }
                .form-section {
                    background: #fff; padding: 2rem; border-radius: 20px; border: 1px solid #f1f5f9;
                }
                .form-section h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; color: #1e293b; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
                .input-group label { font-size: 0.875rem; font-weight: 500; color: #64748b; }
                input, textarea {
                    padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
                    font-size: 0.9375rem; background: #f8fafc; transition: all 0.3s;
                }
                input:focus, textarea:focus {
                    outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
                }
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 2rem; }
                .cancel-btn {
                    padding: 0.75rem 1.5rem; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px; font-weight: 600; color: #64748b; cursor: pointer;
                }
                .save-btn {
                    padding: 0.75rem 2rem; background: #ffc451; border: none; border-radius: 12px;
                    font-weight: 700; color: #fff; cursor: pointer;
                }
            `}</style>
        </div>
    );
}
