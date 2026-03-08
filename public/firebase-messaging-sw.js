importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCRdoslXdwCkyqgthqX4xiBZ45hl2yS87E",
    authDomain: "gyral-a3744.firebaseapp.com",
    projectId: "gyral-a3744",
    storageBucket: "gyral-a3744.firebasestorage.app",
    messagingSenderId: "270216970249",
    appId: "1:270216970249:web:1be84d95c8f90e532e78d8",
    measurementId: "G-5ERBE98CVV"
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
