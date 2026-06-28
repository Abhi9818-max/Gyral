importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBFXAw_8nO5buOVCIjSFF4I-HybzEUnEO8",
    authDomain: "gyral-1d6da.firebaseapp.com",
    projectId: "gyral-1d6da",
    storageBucket: "gyral-1d6da.firebasestorage.app",
    messagingSenderId: "658071753393",
    appId: "1:658071753393:web:439e878a522cd52d08c890",
    measurementId: "G-E8C43WHR9P"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        }));
    } else {
        event.waitUntil(clients.openWindow('/'));
    }
});
