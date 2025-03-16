const CACHE_NAME = 'spotify-local-cache-v1';
const AUDIO_CACHE_NAME = 'spotify-local-audio-cache-v1';
const IMAGE_CACHE_NAME = 'spotify-local-image-cache-v1';

const CACHED_URLS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/default-cover.svg'
];

// Install event - cache basic app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHED_URLS))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('spotify-local-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event - handle requests with appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav')) {
    event.respondWith(handleAudioFetch(event.request));
    return;
  }
  
  // Handle images
  if (event.request.destination === 'image') {
    event.respondWith(handleImageFetch(event.request));
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Handle audio file caching
async function handleAudioFetch(request) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch and cache
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.status === 200) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching audio:', error);
    throw error;
  }
}

// Handle image caching
async function handleImageFetch(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response.status === 200) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// Handle cache cleanup
self.addEventListener('message', (event) => {
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      Promise.all([
        caches.delete(AUDIO_CACHE_NAME),
        caches.delete(IMAGE_CACHE_NAME)
      ])
    );
  }
}); 