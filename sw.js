// ===== 欲の持続評価モデル PWA用サービスワーカー =====

const CACHE_NAME = 'desire-model-v1.0.0';
const APP_SHELL = [
  './',
  './desire.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// --- インストール時（初回アクセス時）: 必要ファイルをキャッシュ ---
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// --- アクティベート時: 古いキャッシュを削除 ---
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Remove old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// --- フェッチ時: キャッシュ優先、無ければネットワークから取得 ---
self.addEventListener('fetch', (event) => {
  // API等を除外（基本は全てキャッシュ優先）
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // キャッシュにあれば即返す
        return response;
      }
      // 無ければ取得してキャッシュ
      return fetch(event.request)
        .then(networkResponse => {
          // キャッシュ可能なら追加
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // オフライン時に desire.html をフォールバック表示
          return caches.match('./desire.html');
        });
    })
  );
});