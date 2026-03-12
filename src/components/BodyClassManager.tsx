"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BodyClassManager() {
    const pathname = usePathname();

    useEffect(() => {
        // Handle index-page class
        if (pathname === "/") {
            document.body.classList.add("index-page");
        } else {
            document.body.classList.remove("index-page");
        }

        if (pathname?.startsWith("/admin")) {
            document.body.classList.add("admin-page");
            return; // Don't add scrolled class for admin
        } else {
            document.body.classList.remove("admin-page");
        }

        // Handle scrolled class on scroll
        const handleScroll = () => {
            const selectBody = document.querySelector('body');
            if (!selectBody) return;
            if (window.scrollY > 100) {
                selectBody.classList.add('scrolled');
            } else {
                selectBody.classList.remove('scrolled');
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);



        // Re-initialize AOS if it's available
        if (typeof window !== 'undefined' && (window as any).AOS) {
            (window as any).AOS.refresh();
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [pathname]);

    return null;
}
