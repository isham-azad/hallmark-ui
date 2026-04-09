"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateAboutUs } from "../actions";
import { useAdminToast } from "@/components/AdminToast";

interface AboutUsData {
    title: string;
    description1: string;
    description2: string;
    description3: string;
    points: string[];
    image?: string;
    cards?: { icon: string; title: string; desc: string }[];
}

interface AboutUsClientProps {
    initialData: any;
}

export default function AboutUsClient({ initialData }: AboutUsClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<AboutUsData>(initialData || {
        title: "Hallmark Enterprises",
        description1: "Established in 2014, Hallmark Enterprises is a consumer-focused company committed to delivering high-quality, affordable essentials for everyday living. Founded by Mr. Vinod Bhaskaran, who brings over 25 years of experience in retail marketing and channel sales across India and the Gulf, Hallmark combines market expertise with a strong value-driven approach.",
        description2: "Hallmark began with a trusted range of home care products including Soph Detergent Liquid, Soph Dishwash Liquid, Soph Handwash, Soph Washing Powder, Emitol Floor Cleaner and Emitol Toilet Cleaner, which quickly gained market acceptance for their quality and reliability.",
        description3: "With a strong focus on quality, affordability, and long-term partnerships, Hallmark continues to serve households and retailers with dependable products that meet every day needs.",
        points: [
            "PDM Maharaja – spices and dry fruits",
            "Vita Rich – pulses, masala items, rice flakes, and daily staples"
        ],
        image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566351/hallmark/assets/img/about.jpg",
        cards: [
            { icon: "bi-calendar-check-fill", title: "Since 2014", desc: "Committed to delivering high-quality, affordable essentials for over a decade." },
            { icon: "bi-person-vcard-fill", title: "Expert Leadership", desc: "Led by Mr. Vinod Bhaskaran with 25+ years of retail marketing excellence." },
            { icon: "bi-globe-central-south-asia", title: "Regional Presence", desc: "Proven track record across India and the Gulf with strong market expertise." },
            { icon: "bi-shield-fill-check", title: "Dependable Value", desc: "A value-driven approach focused on building long-term consumer partnerships." }
        ]
    });
    
    // Sync local state when props change (after router.refresh())
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreview(initialData.image);
        }
    }, [initialData]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | undefined>(formData.image);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCardChange = (index: number, key: keyof NonNullable<AboutUsData['cards']>[0], val: string) => {
        const newCards = [...(formData.cards || [])];
        newCards[index] = { ...newCards[index], [key]: val };
        setFormData({ ...formData, cards: newCards });
    };

    const addCard = () => {
        setFormData({ ...formData, cards: [...(formData.cards || []), { icon: "", title: "", desc: "" }] });
    };

    const removeCard = (index: number) => {
        setFormData({ ...formData, cards: (formData.cards || []).filter((_, i) => i !== index) });
    };

    const handlePointChange = (index: number, val: string) => {
        const newPoints = [...formData.points];
        newPoints[index] = val;
        setFormData({ ...formData, points: newPoints });
    };

    const addPoint = () => {
        setFormData({ ...formData, points: [...formData.points, ""] });
    };

    const removePoint = (index: number) => {
        setFormData({ ...formData, points: formData.points.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image;
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("images", imageFile);
                uploadFormData.append("folder", "website");
                const res = await fetch("/api/admin/website/upload", { method: "POST", body: uploadFormData });
                const result = await res.json();
                if (result.success && result.urls.length > 0) imageUrl = result.urls[0];
                else throw new Error(result.error || "Upload failed");
            }

            const res = await updateAboutUs({ ...formData, image: imageUrl });
            if (res.success) {
                showToast("About Us updated successfully");
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
        <div className="about-us-container">
            {ToastComponent}
            <div className="section-header">
                <h3>About Us Management</h3>
                <p>Edit the content for the homepage about section.</p>
            </div>

            <form onSubmit={handleSubmit} className="about-form">
                <div className="form-layout">
                    <div className="left-side">
                        <div className="form-card">
                            <h4>Main Content</h4>
                            <div className="input-group">
                                <label>Section Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Description Paragraph 1</label>
                                <textarea 
                                    rows={4} 
                                    value={formData.description1} 
                                    onChange={(e) => setFormData({ ...formData, description1: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Description Paragraph 2</label>
                                <textarea 
                                    rows={4} 
                                    value={formData.description2} 
                                    onChange={(e) => setFormData({ ...formData, description2: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>Description Paragraph 3 (after points)</label>
                                <textarea 
                                    rows={4} 
                                    value={formData.description3} 
                                    onChange={(e) => setFormData({ ...formData, description3: e.target.value })} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-card mt-4">
                            <h4>Highlight Cards</h4>
                            <div className="cards-list">
                                {(formData.cards || []).map((card, i) => (
                                    <div key={i} className="card-item" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
                                        <button type="button" className="remove-btn" onClick={() => removeCard(i)} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                            <i className="bi bi-x"></i>
                                        </button>
                                        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                            <label>Icon Class (e.g., bi-shield-fill-check)</label>
                                            <input type="text" value={card.icon} onChange={(e) => handleCardChange(i, 'icon', e.target.value)} placeholder="Bootstrap Icon Class" />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                            <label>Card Title</label>
                                            <input type="text" value={card.title} onChange={(e) => handleCardChange(i, 'title', e.target.value)} placeholder="Title" />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: '0' }}>
                                            <label>Card Description</label>
                                            <textarea rows={2} value={card.desc} onChange={(e) => handleCardChange(i, 'desc', e.target.value)} placeholder="Short description..." />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="add-point-btn" onClick={addCard}>
                                <i className="bi bi-plus-lg"></i> Add Card
                            </button>
                        </div>

                        <div className="form-card mt-4">
                            <h4>Bullet Points</h4>
                            <div className="points-list">
                                {formData.points.map((point, i) => (
                                    <div key={i} className="point-item">
                                        <input 
                                            type="text" 
                                            value={point} 
                                            onChange={(e) => handlePointChange(i, e.target.value)} 
                                            placeholder="Point text..."
                                        />
                                        <button type="button" className="remove-btn" onClick={() => removePoint(i)}>
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="add-point-btn" onClick={addPoint}>
                                <i className="bi bi-plus-lg"></i> Add Point
                            </button>
                        </div>
                    </div>

                    <div className="right-side">
                        <div className="form-card sticky">
                            <h4>Section Image</h4>
                            <div className="image-upload-box" onClick={() => fileInputRef.current?.click()}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="About Us" />
                                ) : (
                                    <div className="placeholder">
                                        <i className="bi bi-cloud-upload"></i>
                                        <span>Click to upload image</span>
                                    </div>
                                )}
                            </div>
                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange} 
                            />
                            <p className="hint">Recommended size: 800x600px. JPG/PNG.</p>
                            
                            <div className="form-actions-sticky">
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .about-us-container { width: 100%; }
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
                
                .point-item { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
                .point-item input { flex: 1; padding: 10px 12px; border-radius: 10px; }
                .remove-btn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #fee2e2; color: #ef4444; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; transition: 0.2s; }
                .remove-btn:hover { background: #fee2e2; }
                
                .add-point-btn { background: #f0fdfa; color: #0d9488; border: 1px dashed #0d9488; padding: 10px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 0.5rem; }
                .add-point-btn:hover { background: #ccfbf1; }

                .image-upload-box { border: 2px dashed #e2e8f0; background: #f8fafc; border-radius: 16px; height: 250px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
                .image-upload-box img { width: 100%; height: 100%; object-fit: cover; }
                .placeholder { text-align: center; color: #94a3b8; }
                .placeholder i { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
                
                .hint { font-size: 0.75rem; color: #94a3b8; text-align: center; margin-top: 0.75rem; }
                .save-btn { width: 100%; padding: 12px; background: #ffc451; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 1.5rem; }
                .save-btn:hover { background: #f8b42d; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,196,81,0.25); }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                
                .hidden { display: none; }
                .mt-4 { margin-top: 1.5rem; }
                
                @media (max-width: 992px) {
                    .form-layout { grid-template-columns: 1fr; }
                    .sticky { position: static; }
                }
            `}</style>
        </div>
    );
}
