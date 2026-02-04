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
    // Basic fetch handler that supports offline fallback
    event.respondWith(
        fetch(event.request).catch(async () => {
            // If this is a navigation request (for a page)
            if (event.request.mode === 'navigate') {
                // Return a simple offline page
                return new Response('<!DOCTYPE html><html><body><h1>You are offline</h1><p>Please check your connection to the Neural Link.</p></body></html>', {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            // For images/other assets, we could return placeholders, but for now just fail gracefully
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
});
