/* HallMark service worker: offline support for category pages.
 * Bump VERSION on changes to purge old caches. */
const VERSION = "v1";
const STATIC_CACHE = `hm-static-${VERSION}`; // JS/CSS/fonts/images
const PAGE_CACHE = `hm-pages-${VERSION}`; // HTML documents
const DATA_CACHE = `hm-data-${VERSION}`; // /api/site/* JSON
const ALL_CACHES = [STATIC_CACHE, PAGE_CACHE, DATA_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_PAGES = ["/category/all"];
const PRECACHE_API = ["/api/site/categories", "/api/site/products"];

const DATA_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // stale data older than this is not served offline
const NETWORK_TIMEOUT_MS = 4000;
const MAX_STATIC_ENTRIES = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGE_CACHE);
      await pages.add(OFFLINE_URL);
      // Best-effort warmup; failures must not block install.
      await Promise.allSettled(PRECACHE_PAGES.map((u) => pages.add(u)));
      const data = await caches.open(DATA_CACHE);
      await Promise.allSettled(PRECACHE_API.map((u) => data.add(u)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("hm-") && !ALL_CACHES.includes(k)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never touch admin, auth-ish or non-category API traffic.
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/admin")) return;
    if (url.pathname === "/sw.js") return;

    if (req.mode === "navigate") {
      if (url.pathname.startsWith("/category/")) {
        event.respondWith(networkFirstPage(req));
      }
      return;
    }
    if (PRECACHE_API.includes(url.pathname)) {
      event.respondWith(networkFirstData(req));
      return;
    }
    if (url.pathname.startsWith("/api/")) return;
    if (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/_next/image") ||
      url.pathname.startsWith("/assets/")
    ) {
      event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
      return;
    }
    return;
  }

  // Cross-origin: Cloudinary images, font CDN CSS/fonts.
  if (
    url.hostname === "res.cloudinary.com" ||
    url.hostname === "cdnjs.cloudflare.com" ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com"
  ) {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
  }
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e))
    );
  });
}

// Online: fresh page, cache updated. Offline/slow: cached page, else offline.html.
async function networkFirstPage(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok) cache.put(req.url, res.clone());
    return res;
  } catch {
    return (await cache.match(req.url)) || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

// Same, for JSON; also stamps cache time so very old data is not served.
async function networkFirstData(req) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok) {
      const headers = new Headers(res.headers);
      headers.set("x-sw-cached-at", String(Date.now()));
      const body = await res.clone().blob();
      cache.put(req.url, new Response(body, { status: res.status, statusText: res.statusText, headers }));
    }
    return res;
  } catch {
    const cached = await cache.match(req.url);
    if (cached) {
      const at = Number(cached.headers.get("x-sw-cached-at") || 0);
      if (!at || Date.now() - at < DATA_MAX_AGE_MS) return cached;
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Serve cache instantly, refresh it in the background.
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const refresh = fetch(req)
    .then(async (res) => {
      if (res.ok || res.type === "opaque") {
        await cache.put(req, res.clone());
        trim(cache, MAX_STATIC_ENTRIES);
      }
      return res;
    })
    .catch(() => null);
  if (cached) return cached;
  return (await refresh) || Response.error();
}

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}
