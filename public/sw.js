// Service Worker for Gyral PWA
// Handles: offline caching, push notifications, background sync

const CACHE_NAME = 'gyral-cache-v2';
const OFFLINE_URL = '/';

// Core shell files to pre-cache during install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install: pre-cache core shell ───
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ─── Activate: purge old caches ───
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: stale-while-revalidate for navigations, cache-first for assets ───
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and chrome-extension / API calls
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (request.url.includes('/auth/')) return;
  if (request.url.includes('supabase')) return;
  if (request.url.includes('googleapis')) return;
  if (request.url.startsWith('chrome-extension://')) return;

  // Navigation requests (HTML pages): network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve from cache, or the offline page
          return caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Only cache successful same-origin or CORS responses
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          if (cachedResponse) return cachedResponse;
          throw err;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let notificationData = {
    title: 'Gyral',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: payload.data || { url: payload.url },
        requireInteraction: payload.requireInteraction || false,
      };
    } catch (e) {
      console.error('[SW] Error parsing push payload:', e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
    })
  );
});

// ─── Notification Click ───
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then((client) => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ─── Background Sync ───
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  console.log('[SW] Syncing notifications…');
}
