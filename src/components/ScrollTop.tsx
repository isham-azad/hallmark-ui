"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTop() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    const [isVisible, setIsVisible] = useState(false);

    if (isAdmin) return null;

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = (e: React.MouseEvent) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <a
            href="#"
            id="scroll-top"
            onClick={scrollToTop}
            className={`scroll-top d-flex align-items-center justify-content-center ${isVisible ? "active" : ""}`}
        >
            <i className="bi bi-arrow-up-short"></i>
        </a>
    );
}
