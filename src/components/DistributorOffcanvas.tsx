"use client";

import { useEffect, useRef, useState } from "react";
import { useInvest } from "@/context/InvestContext";

export default function DistributorOffcanvas() {
    const { isDistributorOpen, setIsDistributorOpen } = useInvest();
    const offcanvasRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        state: "",
        city: "",
        pin: "",
        phone: "",
        email: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const bootstrap = (window as any).bootstrap;
            const element = offcanvasRef.current;
            if (element && bootstrap) {
                const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(element);
                
                if (isDistributorOpen) {
                    offcanvas.show();
                    setSubmitted(false);
                } else {
                    offcanvas.hide();
                    
                    // Force cleanup backdrop if it lingers
                    setTimeout(() => {
                        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                        if (backdrops.length > 0 && !isDistributorOpen) {
                            backdrops.forEach(b => b.remove());
                            document.body.style.overflow = "";
                            document.body.style.paddingRight = "";
                        }
                    }, 500);
                }

                const handleHidden = () => setIsDistributorOpen(false);
                element.addEventListener("hidden.bs.offcanvas", handleHidden);
                
                return () => {
                    element.removeEventListener("hidden.bs.offcanvas", handleHidden);
                    const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                    backdrops.forEach(b => b.remove());
                };
            }
        }
    }, [isDistributorOpen, setIsDistributorOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch("/api/site/enquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    message: `Distributor Interest\nState: ${formData.state}\nCity: ${formData.city}\nPIN: ${formData.pin}`,
                    type: "DISTRIBUTOR_INQUIRY"
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
                setFormData({ name: "", state: "", city: "", pin: "", phone: "", email: "" });
            } else {
                throw new Error(data.error || "Submission failed");
            }
        } catch (error: any) {
            console.error("Distributor enquiry error:", error);
            alert(error.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex={-1}
            id="distributorOffcanvas"
            ref={offcanvasRef}
            aria-labelledby="distributorOffcanvasLabel"
            style={{ width: "450px" }}
        >
            <div className="offcanvas-header" style={{ backgroundColor: '#111', borderBottom: '1px solid #333' }}>
                <h5 className="offcanvas-title fw-bold text-white d-flex align-items-center" id="distributorOffcanvasLabel">
                    <span className="d-flex align-items-center justify-content-center rounded-circle me-3" style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 196, 81, 0.1)' }}>
                        <i className="bi bi-briefcase" style={{ color: '#ffc451' }}></i>
                    </span>
                    Distributor Relations
                </h5>
                <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => setIsDistributorOpen(false)}
                    style={{ opacity: 0.8 }}
                ></button>
            </div>

            <div className="offcanvas-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                {submitted ? (
                    <div className="text-center py-5" data-aos="fade-in">
                        <div className="mb-4">
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "5rem" }}></i>
                        </div>
                        <h4 className="fw-bold">Details Received!</h4>
                        <p className="text-muted">Thank you for your interest. One of our team members will get in touch with you shortly.</p>
                        <button
                            className="btn btn-primary w-100 mt-3 rounded-pill py-3"
                            onClick={() => setIsDistributorOpen(false)}
                            data-bs-dismiss="offcanvas"
                            style={{ backgroundColor: '#111', border: 'none', color: '#ffc451', fontWeight: '700' }}
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="invest-form bg-white p-4 rounded-4 shadow-sm border border-light">
                        <div className="mb-4 text-center p-3 rounded-3" style={{ backgroundColor: '#111', color: '#fff' }}>
                            <h6 className="fw-bold mb-1 text-uppercase" style={{ color: '#ffc451', letterSpacing: '1px', fontSize: '0.85rem' }}>Partner with Us</h6>
                            <p className="small text-white-50 mb-0" style={{ textAlign: "justify" }}>We sincerely thank you for your interest in becoming our distributor. Partner with us and take your business growth to the next level. Please share your contact details below, and one of our team members will get in touch with you shortly.</p>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="name" className="form-label small fw-bold text-muted">Your Name *</label>
                            <input
                                type="text"
                                className="form-control bg-light"
                                id="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label htmlFor="state" className="form-label small fw-bold text-muted">State *</label>
                                <input
                                    type="text"
                                    className="form-control bg-light"
                                    id="state"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="city" className="form-label small fw-bold text-muted">City *</label>
                                <input
                                    type="text"
                                    className="form-control bg-light"
                                    id="city"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="pin" className="form-label small fw-bold text-muted">PIN Code</label>
                            <input
                                type="text"
                                className="form-control bg-light"
                                id="pin"
                                placeholder="6-digit PIN"
                                value={formData.pin}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label small fw-bold text-muted">Mobile Number *</label>
                            <input
                                type="tel"
                                className="form-control bg-light"
                                id="phone"
                                placeholder="+91 XXXXX XXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="form-label small fw-bold text-muted">Email ID</label>
                            <input
                                type="email"
                                className="form-control bg-light"
                                id="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="d-grid mt-4">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg rounded-pill"
                                disabled={submitting}
                                style={{ backgroundColor: '#ffc451', border: 'none', color: '#000', fontWeight: '700' }}
                            >
                                {submitting ? (
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                ) : (
                                    <i className="bi bi-person-plus me-2"></i>
                                )}
                                Submit Details
                            </button>
                        </div>

                        <p className="text-center mt-4 x-small text-muted mb-0">
                            <i className="bi bi-shield-lock me-1"></i>
                            Your information is confidential and secure.
                        </p>
                    </form>
                )}
            </div>

            <style jsx>{`
                .form-control {
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                    font-size: 0.95rem;
                }
                .form-control:focus {
                    box-shadow: 0 0 0 0.25rem rgba(255, 196, 81, 0.15);
                    border-color: #ffc451;
                }
                .x-small {
                    font-size: 0.75rem;
                }
            `}</style>
        </div>
    );
}
