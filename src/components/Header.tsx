"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

interface NavBrand {
    id: string;
    name: string;
}

interface NavCategory {
    id: string;
    name: string;
}

export default function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [brands, setBrands] = useState<NavBrand[]>([]);
    const [categories, setCategories] = useState<NavCategory[]>([]);
    const { cartCount, toggleCart } = useCart();
    const [b2bUser, setB2bUser] = useState<{ username: string; companyName: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        handleScroll(); // Initial check
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        Promise.all([
            fetch("/api/site/brands").then((r) => r.json()),
            fetch("/api/site/categories").then((r) => r.json()),
        ]).then(([brandsRes, categoriesRes]) => {
            setBrands(brandsRes.brands ?? []);
            setCategories(categoriesRes.categories ?? []);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        fetch("/api/b2b/me")
            .then((r) => r.json())
            .then((res) => { if (res.authenticated) setB2bUser(res.user); })
            .catch(() => {})
            .finally(() => setMounted(true));
    }, []);

    const isHomePage = pathname === "/";
    const isShopFlow = pathname.startsWith("/shop") || pathname === "/cart" || pathname === "/checkout" || pathname === "/order-success";
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) return null;

    // Combine scroll state with homepage logic for the background class
    const headerClass = `header d-flex flex-column fixed-top p-0 ${isScrolled || !isHomePage ? "scrolled" : ""}`;

    return (
        <header id="header" className={headerClass} style={{ top: 0 }}>
            <div style={{
                maxHeight: isScrolled ? "0" : "60px",
                overflow: "hidden",
                transition: "max-height 0.3s ease",
            }}>
                <div className="top-strip w-100" style={{ backgroundColor: "#111", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 1002, position: "relative" }}>
                    <div className="container-fluid container-xl d-flex justify-content-between align-items-center py-2">
                        <div className="contact-info d-flex align-items-center text-light" style={{ fontSize: "0.8rem", opacity: 0.9, gap: "clamp(0.5rem, 3vw, 2rem)", flexWrap: "nowrap", minWidth: 0 }}>
                            <span className="d-none d-md-flex align-items-center text-decoration-none" style={{ whiteSpace: "nowrap" }} suppressHydrationWarning>
                                <i className="bi bi-envelope me-2" style={{ color: "#ffc451" }}></i>
                                <span suppressHydrationWarning>care@hallmarkworld.com</span>
                            </span>
                            <span className="d-flex align-items-center text-decoration-none" style={{ whiteSpace: "nowrap" }} suppressHydrationWarning>
                                <i className="bi bi-telephone text-success me-2"></i>
                                <span suppressHydrationWarning>+91 894 3051 632</span>
                            </span>
                        </div>
                        {mounted && (b2bUser ? (
                            <Link href="/b2b/account" className="text-light text-decoration-none fw-bold d-flex align-items-center bg-dark rounded flex-shrink-0" style={{ fontSize: "0.80rem", letterSpacing: "0.5px", border: "1px solid rgba(255,196,81,0.3)", padding: "4px 10px", whiteSpace: "nowrap" }}>
                                <i className="bi bi-person-circle me-1 me-md-2" style={{ color: "#ffc451" }}></i>
                                <span className="d-none d-sm-inline">My Account</span>
                                <span className="d-inline d-sm-none">Account</span>
                            </Link>
                        ) : (
                            <Link href="/b2b/login" className="text-light text-decoration-none fw-bold d-flex align-items-center bg-dark rounded flex-shrink-0" style={{ fontSize: "0.80rem", letterSpacing: "0.5px", border: "1px solid rgba(255,196,81,0.3)", padding: "4px 10px", whiteSpace: "nowrap" }}>
                                <i className="bi bi-person-badge me-1 me-md-2" style={{ color: "#ffc451" }}></i>
                                <span className="d-none d-sm-inline">B2B Login</span>
                                <span className="d-inline d-sm-none">B2B</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div style={{ height: "4px", background: "linear-gradient(90deg, #ffc451 0%, rgba(255,196,81,0.2) 50%, transparent 100%)", width: "100%" }}></div>
            </div>

            <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between header-main-area flex-grow-1 w-100 py-3">
                <Link href="/" className="logo d-flex align-items-center me-auto me-lg-0">
                    <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png" alt="HallMark" className="img-fluid" style={{ width: "150px", height: "50px" }} />
                </Link>

                {isShopFlow ? (
                    <button
                        className="header-icon-btn ms-auto border-0 bg-transparent"
                        title="Shopping Cart"
                        onClick={toggleCart}
                        style={{ zIndex: 1001 }}
                    >
                        <i className="bi bi-cart3"></i>
                        <span className="cart-badge">{cartCount}</span>
                    </button>
                ) : (
                    <Link className="btn-getstarted d-inline-flex position-relative ms-auto" href="/shop" style={{ zIndex: 1001 }}>
                        Shop Online
                    </Link>
                )}

                <nav id="navmenu" className="navmenu">
                    <ul>
                        <li><Link href="/#hero" className={pathname === "/" ? "active" : ""}>Home</Link></li>
                        <li><Link href="/#about">About Us</Link></li>
                        <li className="dropdown">
                            <a href="#"><span>Our Brands</span> <i className="bi bi-chevron-down toggle-dropdown"></i></a>
                            <ul>
                                {brands.map((b) => (
                                    <li key={b.id}><Link href={`/brand/${b.id}`}>{b.name}</Link></li>
                                ))}
                            </ul>
                        </li>
                        <li className="dropdown">
                            <a href="#"><span>Our Products</span> <i className="bi bi-chevron-down toggle-dropdown"></i></a>
                            <ul>
                                {categories.map((c) => (
                                    <li key={c.id}><Link href={`/category/${c.id}`}>{c.name}</Link></li>
                                ))}
                            </ul>
                        </li>
                        <li><Link href="/#contact">Contact Us</Link></li>
                    </ul>
                    <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
                </nav>
            </div>
        </header>
    );
}
