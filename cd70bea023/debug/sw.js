// サービスワーカー有効化時に即座にコントロールを開始する
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ページへのアクセス（ナビゲーションリクエスト）を監視
self.addEventListener('fetch', (event) => {
  // index.htmlへのアクセスや、ページの再読み込みの場合
  if (event.request.mode === 'navigate') {
    // キャッシュを無視して、必ずネットワークから最新のファイルを取得する
    event.respondWith(
      fetch(event.request).catch(() => {
        // オフラインの場合のフォールバック処理（今回は何もしない）
      })
    );
  }
});