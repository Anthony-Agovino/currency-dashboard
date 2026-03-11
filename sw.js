/**
 * Service Worker — Currency Dashboard PWA
 * Cache-first for app shell · Background rate fetching
 */

const CACHE_NAME = 'currency-dashboard-v2';
const API_URL = 'https://open.er-api.com/v6/latest/USD';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ===== Install: Pre-cache app shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ===== Activate: Clean old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();

  // Fetch rate on activation
  fetchAndBroadcastRate();
});

// ===== Fetch: Cache-first for shell, network-first for API =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.href.startsWith('https://open.er-api.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful responses for app resources
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ===== Background Rate Fetching =====
async function fetchAndBroadcastRate() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return;
    const data = await res.json();

    if (data.result === 'success' && data.rates && data.rates.COP) {
      const message = {
        type: 'RATE_UPDATE',
        rate: data.rates.COP,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all clients
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.postMessage(message));
    }
  } catch (err) {
    // Silently fail — the app will use its cached rate
  }
}

// Hourly background fetch
setInterval(fetchAndBroadcastRate, 60 * 60 * 1000);
