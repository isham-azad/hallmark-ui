"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.error("Service worker registration failed:", err);
    });
    // Ask the browser not to evict cached data under storage pressure (best effort).
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}
