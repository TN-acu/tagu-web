// ▼▼▼ 1. 更新のたびに、このバージョン番号を変更してください (例: v1.0.0 -> v1.0.1) ▼▼▼
const CACHE_NAME = 'your-app-cache-v1.0.0'; 
// ▲▲▲ ここを変更 ▲▲▲

// 2. キャッシュするファイルのリスト
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'main.js',
  'quiz.html',
  'quiz_common.js',
  'quiz_style.css',
  'quiz_english.html',
  'quiz_english.js',
  'quiz_english.css',
  'timer-portrait.html',
  'timer-landscape.html',
  'manifest.json',
  'favicon.ico',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  '-quiz_list.txt'
  // 注: 画像などの大きなファイルはキャッシュ対象外としています
];

// 3. インストール処理 (新しいファイルがあればキャッシュに保存)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // ダウンロード後、すぐにサービスワーカーを有効化する
        return self.skipWaiting();
      })
  );
});

// 4. アクティベート処理 (古いキャッシュを削除)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 即座にクライアントの制御を開始する
      return self.clients.claim();
    })
  );
});

// 5. フェッチ処理 (Stale-While-Revalidate 戦略)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 最初にキャッシュから一致するものを探す
      return cache.match(event.request).then((cachedResponse) => {
        // 同時に、ネットワークから最新のものを取得する
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // 取得できたら、キャッシュを更新しておく
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // キャッシュがあればそれを先に返し、なければネットワークの結果を待つ
        return cachedResponse || fetchPromise;
      });
    })
  );
});