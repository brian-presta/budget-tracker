const FILES_TO_CACHE = [
    './index.html',
    './css/styles.css',
    './js/idb.js',
    './js/index.js',
    './manifest.json',
    './',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
]

const APP_PREFIX = 'Budget Tracker-'
const VERSION = 'version_01'
const CACHE_NAME = APP_PREFIX + VERSION
const DATA_CACHE_NAME = `${APP_PREFIX}Data-${VERSION}`

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then( cache => {
            console.log(`installing cache: ${CACHE_NAME}`)
            return cache.addAll(FILES_TO_CACHE)
        })
        .catch(err => console.log(err))
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
        .then( keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key)
                    }
                })
            )
        })
        .catch(err => console.log(err))
    )
})



self.addEventListener('fetch', event => {
    const url = event.request.url
    console.log(`fetch request : ${url}`)
    // static assets are cache-first for speed, API assets are network-first for accuracy
    if (url.includes('api')) {
        console.log(`API request for ${url}, sending to network`)
        event.respondWith(
            caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
              return fetch(event.request)
                .then(response => {
                  // If the response was good, clone it and store it in the cache.
                  if (response.status === 200) {
                    cache.put(event.request.url, response.clone());
                  }
      
                  return response;
                })
                .catch(err => {
                  // Network request failed, try to get it from the cache.
                  console.log('Network down, retrieving most recent API cache')
                  return cache.match(event.request);
                });
            })
            .catch(err => console.log(err))
      
        )
    }
    else {
        event.respondWith(
            caches.match(event.request)
            .then( request => {
                request
                ? console.log(`responding with cache : ${url}`)
                : console.log(`file not cached, fetching : ${url}`)
                return request || fetch(event.request)
            })
            .catch(err => console.log(err))
        )
    }
})

