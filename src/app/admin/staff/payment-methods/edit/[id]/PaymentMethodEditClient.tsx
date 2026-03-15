"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePaymentMethod } from "../../actions";
import { useAdminToast } from "@/components/AdminToast";

interface PaymentMethod {
    id: string;
    name: string;
    summary: string;
}

interface PaymentMethodEditClientProps {
    paymentMethod: PaymentMethod;
}

export default function PaymentMethodEditClient({ paymentMethod }: PaymentMethodEditClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useAdminToast();

    const [formData, setFormData] = useState({
        name: paymentMethod.name,
        summary: paymentMethod.summary,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updatePaymentMethod(paymentMethod.id, {
            name: formData.name,
            summary: formData.summary,
        });
        setLoading(false);

        if (result.success) {
            showToast("Payment method updated successfully!");
            setTimeout(() => router.push("/admin/staff/payment-methods"), 1000);
        } else {
            showToast(result.error || "Failed to update payment method", "error");
        }
    };

    return (
        <div className="edit-pm-container">
            {ToastComponent}
            <div className="header-actions mb-4">
                <Link href="/admin/staff/payment-methods" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Payment Methods
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="pm-form">
                <div className="form-section main-info">
                    <div className="section-header">
                        <h3>Edit Payment Method</h3>
                        <p>Update name and summary.</p>
                    </div>
                    <div className="input-group">
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Credit Card, UPI"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Summary</label>
                        <textarea
                            placeholder="Brief description..."
                            rows={4}
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => router.push("/admin/staff/payment-methods")} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Payment Method"}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .edit-pm-container { max-width: 1000px; animation: slideUp 0.4s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .back-link {
                    display: flex !important; align-items: center !important; gap: 0.5rem !important;
                    color: #64748b !important; text-decoration: none !important; font-weight: 600 !important;
                    font-size: 0.9rem !important; margin-bottom: 2rem !important;
                }
                .back-link:hover { color: #ffc451 !important; }
                .section-header { margin-bottom: 2rem; }
                .section-header h3 { font-size: 1.5rem !important; margin-bottom: 0.25rem !important; }
                .section-header p { color: #64748b; margin: 0; }
                .pm-form { display: flex; flex-direction: column; gap: 2rem; }
                .form-section {
                    background: #fff; padding: 2.5rem; border-radius: 20px; border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
                }
                .form-section h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem; color: #0f172a; }
                .input-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
                .input-group label { font-size: 0.875rem; font-weight: 600; color: #475569; }
                input, textarea {
                    padding: 0.875rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
                    font-size: 0.9375rem; background: #f8fafc; transition: all 0.2s;
                }
                input:focus, textarea:focus {
                    outline: none; border-color: #ffc451 !important; background: #fff;
                    box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1);
                }
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding: 2rem 0; }
                .cancel-btn {
                    padding: 0.875rem 2rem; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px; font-weight: 600; color: #64748b; cursor: pointer;
                }
                .cancel-btn:hover { background: #f1f5f9; }
                .save-btn {
                    padding: 0.875rem 2.5rem; background: #ffc451; border: none; border-radius: 12px;
                    font-weight: 700; color: #fff; cursor: pointer;
                    box-shadow: 0 4px 12px rgba(255, 196, 81, 0.3);
                }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); }
            `}</style>
        </div>
    );
}
