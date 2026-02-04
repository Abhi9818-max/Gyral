self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: '/icon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
                url: data.url || '/'
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Mandatory fetch handler for PWA installability
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // If the fetch fails (e.g. offline), we could return a cached offline page.
            // For now, ensuring we don't just crash is a good start.
            // A simple refinement: check if it's a navigation request and return a fallback.
            if (event.request.mode === 'navigate') {
                // ideally we return a cached offline.html here
                // for now leaving as is but catching the error prevents unhandled rejections
                return new Response('Offline', { headers: { 'Content-Type': 'text/plain' } });
            }
        })
    );
});
