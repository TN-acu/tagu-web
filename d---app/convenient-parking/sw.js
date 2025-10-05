// キャッシュするファイルの名前とバージョン
const CACHE_NAME = 'parking-simulator-cache-v1';

// キャッシュするファイルのリスト
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './auth.js',
  './manifest.json',
  './title.png',
  './parking.png',
  './car.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  // ▼【追加】各種アイコンをキャッシュ対象に追加
  './apple-touch-icon.png',
  './favicon.ico'
];

// サービスワーカーのインストール時に実行される
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 指定されたファイルをすべてキャッシュに追加する
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// サービスワーカーが有効化されたときに実行される
self.addEventListener('activate', (event) => {
  // 古いキャッシュがあれば削除する
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});

// ファイルのリクエストがあった場合に実行される
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // まずキャッシュからファイルを探す
    caches.match(event.request)
      .then((response) => {
        // キャッシュにファイルがあればそれを返す
        if (response) {
          return response;
        }
        // キャッシュになければネットワークから取得しにいく
        return fetch(event.request);
      }
    )
  );
});