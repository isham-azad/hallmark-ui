"use client";

import { useEffect, useRef, useState } from "react";
import { useEnquiry } from "@/context/EnquiryContext";

export default function EnquiryOffcanvas() {
    const { isEnquiryOpen, setIsEnquiryOpen, enquiryProduct } = useEnquiry();
    const offcanvasRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "I'm interested in this product. Please share more details regarding pricing and availability.",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const bootstrap = (window as any).bootstrap;
            const element = offcanvasRef.current;
            if (element && bootstrap) {
                const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(element);
                
                if (isEnquiryOpen) {
                    offcanvas.show();
                    setSubmitted(false);
                } else {
                    offcanvas.hide();
                    
                    // Force cleanup backdrop if it lingers
                    setTimeout(() => {
                        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                        if (backdrops.length > 0 && !isEnquiryOpen) {
                            backdrops.forEach(b => b.remove());
                            document.body.style.overflow = "";
                            document.body.style.paddingRight = "";
                        }
                    }, 500);
                }

                const handleHidden = () => setIsEnquiryOpen(false);
                element.addEventListener("hidden.bs.offcanvas", handleHidden);
                
                return () => {
                    element.removeEventListener("hidden.bs.offcanvas", handleHidden);
                    // Critical cleanup on unmount
                    const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                    backdrops.forEach(b => b.remove());
                    // Remove hidden.bs.offcanvas specific backdrop leftovers
                };
            }
        }
    }, [isEnquiryOpen, setIsEnquiryOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                    product: enquiryProduct,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
                setFormData({ name: "", email: "", phone: "", message: "" });
            } else {
                throw new Error(data.error || "Submission failed");
            }
        } catch (error: any) {
            console.error("Enquiry submission error:", error);
            alert(error.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const openWhatsApp = () => {
        const text = `Hi, I'm interested in *${enquiryProduct?.name}*.\n\n*My Details:*\nName: ${formData.name}\nPhone: ${formData.phone}\nMessage: ${formData.message}`;
        const url = `https://wa.me/+919745606802?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div
            className="offcanvas offcanvas-end"
            tabIndex={-1}
            id="enquiryOffcanvas"
            ref={offcanvasRef}
            aria-labelledby="enquiryOffcanvasLabel"
            style={{ width: "400px" }}
        >
            <div className="offcanvas-header bg-primary text-white">
                <h5 className="offcanvas-title fw-bold text-white" id="enquiryOffcanvasLabel">
                    <i className="bi bi-chat-dots me-2"></i>Product Enquiry
                </h5>
                <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => setIsEnquiryOpen(false)}
                ></button>
            </div>

            <div className="offcanvas-body">
                {enquiryProduct && (
                    <div className="product-summary d-flex align-items-center p-3 mb-4 bg-light rounded-3 border">
                        <img
                            src={enquiryProduct.image?.split(',')[0] || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"}
                            alt={enquiryProduct.name}
                            className="rounded me-3"
                            style={{ width: "60px", height: "60px", objectFit: "cover" }}
                        />
                        <div>
                            <small className="text-muted d-block">{enquiryProduct.category}</small>
                            <h6 className="mb-0 fw-bold">{enquiryProduct.name}</h6>
                        </div>
                    </div>
                )}

                {submitted ? (
                    <div className="text-center py-5" data-aos="fade-in">
                        <div className="mb-4">
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "5rem" }}></i>
                        </div>
                        <h4 className="fw-bold">Enquiry Sent!</h4>
                        <p className="text-muted">Thank you for your interest. Our team will get back to you shortly.</p>
                        <button
                            className="btn btn-primary w-100 mt-3"
                            onClick={() => setIsEnquiryOpen(false)}
                            data-bs-dismiss="offcanvas"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="enquiry-form">
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label small fw-bold text-muted">Full Name *</label>
                            <input
                                type="text"
                                className="form-control form-control-lg fs-6"
                                id="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label small fw-bold text-muted">Email Address</label>
                            <input
                                type="email"
                                className="form-control form-control-lg fs-6"
                                id="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="phone" className="form-label small fw-bold text-muted">Phone Number *</label>
                            <input
                                type="tel"
                                className="form-control form-control-lg fs-6"
                                id="phone"
                                placeholder="+91 XXXXX XXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="message" className="form-label small fw-bold text-muted">Message *</label>
                            <textarea
                                className="form-control fs-6"
                                id="message"
                                rows={4}
                                placeholder="I'm interested in this product. Please share more details regarding pricing and availability."
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div className="d-grid gap-2 mb-4">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                ) : (
                                    <i className="bi bi-send me-2"></i>
                                )}
                                Submit Enquiry
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-success btn-lg"
                                onClick={openWhatsApp}
                            >
                                <i className="bi bi-whatsapp me-2"></i>Enquire via WhatsApp
                            </button>
                        </div>

                        <p className="text-center x-small text-muted">
                            <i className="bi bi-shield-lock me-1"></i>
                            Your details are safe with us. We don't share your information with third parties.
                        </p>
                    </form>
                )}
            </div>

            <style jsx>{`
                .form-control:focus {
                    box-shadow: 0 0 0 0.25rem rgba(var(--accent-color-rgb), 0.1);
                    border-color: var(--accent-color);
                }
                .x-small {
                    font-size: 0.75rem;
                }
            `}</style>
        </div>
    );
}
