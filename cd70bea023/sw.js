// サービスワーカー有効化時に即座にコントロールを開始する
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ページへのアクセス（ナビゲーションリクエスト）や特定ファイルへのアクセスを監視
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ▼▼▼ 変更: キャッシュを常にバイパスしたいファイルのリスト ▼▼▼
  const filesToForceFetch = [
    '/', // ルート (index.html)
    '/index.html',
    '/-quiz_list.txt', // メニューのテキストファイル
    '/main.js',
    '/style.css'
    // quiz.html や quiz_common.js はクエリパラメータ(?data=...)で
    // 内容が変わるため、ここには含めずブラウザキャッシュに任せる
  ];
  // ▲▲▲ 変更ここまで ▲▲▲

  // ▼▼▼ 変更: ナビゲーションリクエスト、または上記リストに含まれるファイルのフェッチの場合 ▼▼▼
  if (event.request.mode === 'navigate' || filesToForceFetch.includes(url.pathname)) {
    // キャッシュを無視して、必ずネットワークから最新のファイルを取得する
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        // オフラインの場合のフォールバック処理（今回は何もしない）
      })
    );
  }
  // ▲▲▲ 変更ここまで ▲▲▲
  // それ以外のリクエスト（画像など）は、デフォルトのキャッシュ戦略に任せる
});