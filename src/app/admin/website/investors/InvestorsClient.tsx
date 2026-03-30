"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateInvestorsSection } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

interface InvestorsData {
    badgeText: string;
    titleLight: string;
    titleBold: string;
    description: string;
    cards: { icon: string; title: string; description: string }[];
    bottomText: string;
}

interface InvestorsClientProps {
    initialData: any;
}

export default function InvestorsClient({ initialData }: InvestorsClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    
    const defaultData: InvestorsData = {
        badgeText: "Investment Opportunities",
        titleLight: "Partner in Our",
        titleBold: "Growth",
        description: "Join Hallmark Enterprises as an investor and become part of a rapidly expanding FMCG market leader. We offer structured returns backed by real-world distribution and substantial market presence.",
        cards: [
            { icon: "bi-bar-chart-fill", title: "Assured ROI", description: "Benefit from consistent, performance-linked returns driven by our high-turnover consumer goods portfolio." },
            { icon: "bi-shield-check", title: "Transparent Operations", description: "We believe in complete transparency. Our robust business model and supply chain are open to rigorous assessment." },
            { icon: "bi-globe-central-south-asia", title: "Scalable Expansion", description: "Capitalize on our aggressive expansion plans across India and the Gulf region, unlocking massive growth potential." }
        ],
        bottomText: "Minimum investment commitments apply. Complete confidentiality maintained."
    };

    const [formData, setFormData] = useState<InvestorsData>(initialData || defaultData);
    
    // Sync local state when props change
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleCardChange = (index: number, field: string, val: string) => {
        const newCards = [...formData.cards];
        newCards[index] = { ...newCards[index], [field]: val };
        setFormData({ ...formData, cards: newCards });
    };

    const addCard = () => {
        setFormData({ ...formData, cards: [...formData.cards, { icon: "bi-star", title: "", description: "" }] });
    };

    const removeCard = (index: number) => {
        setFormData({ ...formData, cards: formData.cards.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await updateInvestorsSection(formData);
            if (res.success) {
                showToast("Investors section updated successfully");
                router.refresh();
            } else {
                showToast(res.error || "Failed to update", "error");
            }
        } catch (error: any) {
            showToast(error.message, "error");
        }
        setLoading(false);
    };

    return (
        <div className="investors-container">
            {ToastComponent}
            <div className="section-header">
                <h3>Investors Section</h3>
                <p>Customize the content for the homepage investors section.</p>
            </div>

            <form onSubmit={handleSubmit} className="investors-form">
                <div className="form-layout">
                    <div className="left-side">
                        <div className="form-card mb-4">
                            <h4>Header Details</h4>
                            <div className="input-group">
                                <label>Badge Text</label>
                                <input 
                                    type="text" 
                                    value={formData.badgeText} 
                                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6 input-group">
                                    <label>Title (White Part)</label>
                                    <input 
                                        type="text" 
                                        value={formData.titleLight} 
                                        onChange={(e) => setFormData({ ...formData, titleLight: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div className="col-md-6 input-group">
                                    <label>Title (Accent/Colored Part)</label>
                                    <input 
                                        type="text" 
                                        value={formData.titleBold} 
                                        onChange={(e) => setFormData({ ...formData, titleBold: e.target.value })} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea 
                                    rows={4} 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Bottom Info Text</label>
                                <input 
                                    type="text" 
                                    value={formData.bottomText} 
                                    onChange={(e) => setFormData({ ...formData, bottomText: e.target.value })} 
                                />
                            </div>
                        </div>

                        <div className="form-card">
                            <h4>Value Proposition Cards</h4>
                            <div className="cards-list">
                                {formData.cards.map((card, i) => (
                                    <div key={i} className="card-item shadow-sm p-4 rounded-4 border mb-4 position-relative">
                                        <button type="button" className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-3" onClick={() => removeCard(i)}>
                                            <i className="bi bi-trash"></i> Remove
                                        </button>
                                        <div className="input-group">
                                            <label>Icon Class (e.g., bi-bar-chart-fill)</label>
                                            <div className="d-flex gap-3 align-items-center">
                                                <i className={`bi ${card.icon} fs-4 text-warning`}></i>
                                                <input 
                                                    type="text" 
                                                    value={card.icon} 
                                                    onChange={(e) => handleCardChange(i, "icon", e.target.value)} 
                                                    placeholder="bi-bar-chart-fill"
                                                    className="flex-grow-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Title</label>
                                            <input 
                                                type="text" 
                                                value={card.title} 
                                                onChange={(e) => handleCardChange(i, "title", e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <textarea 
                                                rows={3} 
                                                value={card.description} 
                                                onChange={(e) => handleCardChange(i, "description", e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn btn-outline-primary w-100 py-3 rounded-pill" onClick={addCard}>
                                <i className="bi bi-plus-lg"></i> Add Card
                            </button>
                        </div>
                    </div>

                    <div className="right-side">
                        <div className="form-card sticky">
                            <h4 className="border-bottom pb-3 mb-4">Publish Changes</h4>
                            <p className="text-muted small mb-4">Updates made here will be instantly reflected on the homepage.</p>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .investors-container { width: 100%; }
                .section-header { margin-bottom: 2rem; }
                .section-header h3 { font-size: 1.5rem; color: #0f172a; font-weight: 700; margin-bottom: 0.25rem; }
                
                .form-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
                .form-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .form-card h4 { font-size: 1.125rem; margin-bottom: 1.5rem; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
                
                .sticky { position: sticky; top: 100px; }
                
                .input-group { margin-bottom: 1.5rem; }
                .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #64748b; font-size: 0.875rem; }
                .input-group input, .input-group textarea { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; transition: 0.2s; }
                .input-group input:focus, .input-group textarea:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255,196,81,0.1); }
                
                .save-btn { width: 100%; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1rem; }
                .save-btn:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,23,42,0.15); }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                
                @media (max-width: 992px) {
                    .form-layout { grid-template-columns: 1fr; }
                    .sticky { position: static; }
                }
            `}</style>
        </div>
    );
}
