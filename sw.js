// 별빛 우주 덧셈 아케이드 - 코드 업데이트 반영에 방해되지 않는 Network-First 서비스 워커
const CACHE_NAME = 'star-math-arcade-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.ico'
];

// 설치 시 대기 없이 즉시 활성화 (skipWaiting)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

// 활성화 시 이전 캐시 정리 및 열린 탭 즉시 제어 (clients.claim)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      )
    ).then(() => self.clients.claim())
  );
});

// 요청 가로채기: 항상 최신 서버 파일(GitHub Pages 수정본)을 먼저 가져오고(cache: 'no-store'),
// 인터넷이 끊긴 오프라인 상태일 때만 캐시를 반환하여 코드 업데이트 방해 요소를 완전히 제거함
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});