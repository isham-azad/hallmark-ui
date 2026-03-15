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
        }).catch(() => {});
    }, []);

    const isHomePage = pathname === "/";
    const isShopFlow = pathname.startsWith("/shop") || pathname === "/cart" || pathname === "/checkout" || pathname === "/order-success";
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) return null;

    // Combine scroll state with homepage logic for the background class
    const headerClass = `header d-flex align-items-center fixed-top ${isScrolled || !isHomePage ? "scrolled" : ""}`;

    return (
        <header id="header" className={headerClass}>
            <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
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
