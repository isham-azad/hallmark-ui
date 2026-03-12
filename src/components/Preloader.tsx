"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Preloader() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    const [loading, setLoading] = useState(true);

    if (isAdmin) return null;

    useEffect(() => {
        const removeLoader = () => {
            setLoading(false);
        };

        // If the page is already loaded or interactive (common in SPA transitions)
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            removeLoader();
        } else {
            window.addEventListener('load', removeLoader);
        }

        // Fallback: Force remove after 1 second to prevent blocking
        const timeout = setTimeout(removeLoader, 1000);

        return () => {
            window.removeEventListener('load', removeLoader);
            clearTimeout(timeout);
        };
    }, []);

    if (!loading) return null;

    return <div id="preloader"></div>;
}
