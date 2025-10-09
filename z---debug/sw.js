self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ▼▼▼ この activate イベントリスナーをすべて置き換え ▼▼▼
self.addEventListener('activate', (event) => {
  const updateTime = new Date().toISOString();
  event.waitUntil(
    self.clients.claim().then(() => {
      // Service Workerが有効化され、ページを制御下に置いた後でメッセージを送信する
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        return Promise.all(
          clients.map(client => {
            return client.postMessage({ type: 'APP_UPDATED', time: updateTime });
          })
        );
      });
    })
  );
});
// ▲▲▲ ここまで置き換え ▲▲▲

// ページへのアクセス（ナビゲーションリクエスト）や特定ファイルへのアクセスを監視
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const filesToForceFetch = [
  '/', // ルート (index.html)
  './index.html',
  './style.css',
  './script.js',
  './auth.js',
  './manifest.json',
  './title.png',
  './parking.png',
  './car.png',
  ];

  if (event.request.mode === 'navigate' || filesToForceFetch.includes(url.pathname)) {
    // キャッシュを無視して、必ずネットワークから最新のファイルを取得する
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        // オフラインの場合のフォールバック処理（今回は何もしない）
      })
    );
  }
  // それ以外のリクエスト（画像など）は、デフォルトのキャッシュ戦略に任せる
});