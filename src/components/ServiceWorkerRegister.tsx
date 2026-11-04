"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const sendLoadedResources = async () => {
      const reg = await navigator.serviceWorker.ready;
      const urls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => u.startsWith("http"));
      reg.active?.postMessage({ type: "CACHE_URLS", urls });
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => {
        if (document.readyState === "complete") setTimeout(sendLoadedResources, 1500);
        else window.addEventListener("load", () => setTimeout(sendLoadedResources, 1500), { once: true });
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    // Ask the browser not to evict cached data under storage pressure (best effort).
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}
