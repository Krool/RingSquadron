/**
 * Ring Squadron Service Worker
 * Enables offline play and caching for PWA support
 */

const CACHE_NAME = 'ring-squadron-v4';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/renderer.js',
    './js/audio.js',
    './js/input.js',
    './js/entities/player.js',
    './js/entities/ally.js',
    './js/entities/enemy.js',
    './js/entities/boss.js',
    './js/entities/bullet.js',
    './js/entities/ring.js',
    './js/entities/powerup.js',
    './js/systems/collision.js',
    './js/systems/spawner.js',
    './js/systems/weapons.js',
    './js/systems/shop.js',
    './js/systems/formation.js',
    './js/systems/particles.js',
    './js/systems/combo.js',
    './js/systems/save.js',
    './js/systems/gamemode.js',
    './js/systems/campaign.js',
    './js/systems/music.js',
    './js/systems/haptics.js',
    './js/systems/floatingtext.js',
    './js/systems/objectpool.js',
    './js/utils/config.js',
    './js/utils/sprites.js',
    './manifest.json'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Ring Squadron: Caching app assets');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Activate immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Ring Squadron: Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses or non-GET requests
                    if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // If both cache and network fail, show offline page for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
