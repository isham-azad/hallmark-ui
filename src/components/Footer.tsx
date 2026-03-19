"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShimmerBox } from "@/components/Shimmer";

interface NavBrand {
    id: string;
    name: string;
}

export default function Footer() {
    const pathname = usePathname();
    const [brands, setBrands] = useState<NavBrand[]>([]);
    const [brandsLoading, setBrandsLoading] = useState(true);
    const [subscribeState, setSubscribeState] = useState({ loading: false, success: false, error: "" });
    const isAdmin = pathname?.startsWith("/admin");

    useEffect(() => {
        fetch("/api/site/brands")
            .then((r) => r.json())
            .then((res) => setBrands(res.brands ?? []))
            .catch(() => { })
            .finally(() => setBrandsLoading(false));
    }, []);

    const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubscribeState({ loading: true, success: false, error: "" });
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const res = await fetch("/api/site/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            if (result.success) {
                setSubscribeState({ loading: false, success: true, error: "" });
                (e.target as HTMLFormElement).reset();
                setTimeout(() => setSubscribeState(prev => ({ ...prev, success: false })), 5000);
            } else {
                setSubscribeState({ loading: false, success: false, error: result.error || "Failed to subscribe." });
            }
        } catch (err) {
            setSubscribeState({ loading: false, success: false, error: "Something went wrong." });
        }
    };

    if (isAdmin) return null;

    return (

        <footer id="footer" className="footer dark-background">
            <div className="footer-top">
                <div className="container">
                    <div className="row gy-4">
                        <div className="col-lg-4 col-md-6 footer-about">
                            <a href="/" className="logo d-flex align-items-center">
                                <span className="sitename">HallMark</span>
                            </a>
                            <div className="footer-contact pt-3">
                                <p>Hallmark Enterprises</p>
                                <p>Kerala, India</p>
                                <p className="mt-3"><strong>Phone:</strong> <span>+91 00000 00000</span></p>
                                <p><strong>Email:</strong> <span>care@hallmarkworld.com</span></p>
                            </div>
                            <div className="social-links d-flex mt-4">
                                <a href=""><i className="bi bi-facebook"></i></a>
                                <a href=""><i className="bi bi-instagram"></i></a>
                                <a href=""><i className="bi bi-whatsapp"></i></a>
                                <a href=""><i className="bi bi-linkedin"></i></a>
                            </div>
                        </div>

                        <div className="col-lg-2 col-md-3 col-6 footer-links">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><i className="bi bi-chevron-right"></i> <a href="/#hero"> Home</a></li>
                                <li><i className="bi bi-chevron-right"></i> <a href="/#about"> About Us</a></li>
                                <li><i className="bi bi-chevron-right"></i> <a href="/#services"> Our Products</a></li>
                                <li><i className="bi bi-chevron-right"></i> <a href="/#contact"> Contact Us</a></li>
                                <li><i className="bi bi-chevron-right"></i> <a href="/shop"> Shop Online</a></li>
                            </ul>
                        </div>

                        <div className="col-lg-2 col-md-3 col-6 footer-links">
                            <h4>Our Brands</h4>
                            <ul>
                                {brandsLoading ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <li key={i} className="d-flex align-items-center gap-2">
                                                <ShimmerBox style={{ height: 14, width: 80, flex: 1 }} />
                                            </li>
                                        ))}
                                    </>
                                ) : (
                                    brands.map((b) => (
                                        <li key={b.id}><i className="bi bi-chevron-right"></i> <a href={`/brand/${b.id}`}>{b.name}</a></li>
                                    ))
                                )}
                            </ul>
                        </div>

                        <div className="col-lg-4 col-md-12 footer-newsletter">
                            <h4>Our Newsletter</h4>
                            <p>Subscribe to our newsletter and receive the latest news about our products and offers!</p>
                            <form onSubmit={handleSubscribe} className="php-email-form">
                                <div className="newsletter-form">
                                    <input type="email" name="email" required placeholder="Your email address" />
                                    <input type="submit" value={subscribeState.loading ? "Subscribing..." : "Subscribe"} disabled={subscribeState.loading} />
                                </div>
                                {subscribeState.loading && <div className="loading" style={{display: 'block'}}>Loading...</div>}
                                {subscribeState.error && <div className="error-message" style={{display: 'block'}}>{subscribeState.error}</div>}
                                {subscribeState.success && <div className="sent-message" style={{display: 'block'}}>Your subscription request has been sent. Thank you!</div>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="copyright">
                <div className="container text-center">
                    <p>© <span>Copyright</span> <strong className="px-1 sitename">Hallmark Enterprises</strong> <span>All Rights Reserved</span></p>
                    <div className="credits">
                        <em>"All because we understand you better"</em>
                    </div>
                </div>
            </div>
        </footer>
    );
}
